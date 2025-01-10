import type { Constructor } from '@nzyme/types';

import * as s from '@agentscript-ai/schema';
import { validateOrThrow } from '@agentscript-ai/schema';

import { RuntimeError } from './RuntimeError.js';
import type { Agent as Agent } from './createAgent.js';
import type { StackFrame } from './runtimeTypes.js';
import type { ToolDefinition, ToolEvent } from '../defineTool.js';
import { isTool } from '../defineTool.js';
import type { NativeFunction } from './common.js';
import { allowedNativeFunctions, allowedNativeIdentifiers } from './common.js';
import type { RuntimeController, RuntimeControllerOptions } from './runtimeController.js';
import { createRuntimeControler } from './runtimeController.js';
import type {
    AgentInput,
    AgentInputBase,
    AgentOutput,
    AgentOutputBase,
    AgentTools,
} from '../defineAgent.js';
import type {
    ArrayExpression,
    Expression,
    FunctionCall,
    Identifier,
    Literal,
    MemberExpression,
    NewExpression,
    ObjectExpression,
    Statement,
} from '../parser/astTypes.js';

type ExecuteAgentInputOptions<TInput extends AgentInputBase> = TInput extends undefined
    ? {
          /** Input for the agent. */
          input?: undefined;
      }
    : {
          /** Input for the agent. */
          input: AgentInput<TInput>;
      };

/**
 * Options for the {@link executeAgent} function.
 */
export type ExecuteAgentOptions<
    TTools extends AgentTools,
    TInput extends AgentInputBase,
    TOutput extends AgentOutputBase,
> = {
    /**
     * Agent to execute.
     */
    agent: Agent<TTools, TInput, TOutput>;
} & ExecuteAgentInputOptions<TInput> &
    RuntimeControllerOptions;

/**
 * Result of the {@link executeAgent} function.
 */
export interface ExecuteAgentResult {
    /**
     * Number of ticks executed.
     * A tick is a single async execution in the agent.
     */
    ticks: number;
    /**
     * Whether the agent is done for now.
     * If it is `false`, the agent is not done and the caller should call {@link executeAgent} again.
     */
    done: boolean;
}

/**
 * Execute an agent.
 * @param options - Options for the agent.
 * @returns Result of the agent execution.
 */
export async function executeAgent<
    TTools extends AgentTools,
    TInput extends AgentInputBase,
    TOutput extends AgentOutputBase,
>(options: ExecuteAgentOptions<TTools, TInput, TOutput>): Promise<ExecuteAgentResult> {
    const { agent } = options;

    const controller = createRuntimeControler(options);
    if (!agent.state) {
        agent.state = {
            complete: false,
            root: { startedAt: Date.now() },
        };

        if (agent.output) {
            agent.state.root.variables = {
                result: undefined,
            };
        }
    }

    const root = agent.state.root;
    const script = agent.script.ast;

    if (root.completedAt) {
        return { ticks: controller.ticks, done: true };
    }

    const result = await runBlock(agent, controller, root, script);

    const frames = root.children;
    if (frames?.length === script.length && frames[frames.length - 1].completedAt) {
        completeFrame(root);
        agent.state.complete = true;

        if (agent.output) {
            const result = root.variables?.result as AgentOutput<TOutput>;
            validateOrThrow(agent.output, result);
            agent.state.output = result;
        }

        return { ticks: controller.ticks, done: true };
    }

    return { ticks: controller.ticks, done: result };
}

async function runBlock(
    agent: Agent,
    controller: RuntimeController,
    block: StackFrame,
    statements: Statement[],
) {
    if (!block.children) {
        block.children = [];
    }

    const stack = block.children;
    let index = stack.length - 1;
    let frame: StackFrame | undefined;

    do {
        if (index >= statements.length) {
            // went through all statements in block
            completeFrame(block);
            return true;
        }

        frame = stack[index];
        if (!frame) {
            ({ frame, index } = pushNewFrame(block));
        }

        if (frame.completedAt) {
            index++;
            continue;
        }

        const statement = statements[index];
        const frameDone = await runBlockFrame(agent, controller, block, frame, statement);

        if (frame.completedAt) {
            index++;
            continue;
        }

        return frameDone;
    } while (controller.continue());

    return false;
}

async function runBlockFrame(
    agent: Agent,
    controller: RuntimeController,
    block: StackFrame,
    frame: StackFrame,
    statement: Statement,
) {
    switch (statement.type) {
        case 'Variable': {
            const name = statement.name;

            if (!block.variables) {
                block.variables = {};
            }

            if (name in block.variables) {
                throw new RuntimeError(`Variable ${name} already exists`);
            }

            if (!statement.value) {
                block.variables[name] = undefined;
                completeFrame(frame);
                return true;
            }

            const valueFrame = getFrame(frame, 0);
            const done = await runExpression(agent, controller, block, valueFrame, statement.value);
            if (!done) {
                return false;
            }

            block.variables[name] = valueFrame.value;
            return completeFrame(frame);
        }

        case 'Expression': {
            return await runExpression(agent, controller, block, frame, statement.expr);
        }

        default:
            throw new RuntimeError(`Unknown statement type: ${(statement as Statement).type}`);
    }
}

async function runExpression(
    agent: Agent,
    controller: RuntimeController,
    block: StackFrame,
    frame: StackFrame,
    expression: Expression,
): Promise<boolean> {
    if (frame.completedAt) {
        return true;
    }

    switch (expression.type) {
        case 'Identifier': {
            frame.value = resolveIdentifier(agent, frame, expression);
            return completeFrame(frame);
        }

        case 'Literal': {
            frame.value = resolveLiteral(expression);
            return completeFrame(frame);
        }

        case 'Member': {
            return await runMemberExpression(agent, controller, block, frame, expression);
        }

        case 'Object': {
            return await runObjectExpression(agent, controller, block, frame, expression);
        }

        case 'Array': {
            return await runArrayExpression(agent, controller, block, frame, expression);
        }

        case 'Assignment': {
            const rightFrame = getFrame(frame, 0);

            const result = await runExpression(
                agent,
                controller,
                block,
                rightFrame,
                expression.right,
            );
            if (!result) {
                return false;
            }

            if (expression.left.type === 'Identifier') {
                setVariable(block, expression.left.name, rightFrame.value);
                return completeFrame(frame);
            }

            throw new Error('Assignment left must be a variable');
        }

        case 'FunctionCall': {
            return await runFunctionCall(agent, controller, block, frame, expression);
        }

        case 'New': {
            return await runNewExpression(agent, controller, block, frame, expression);
        }

        default:
            throw new RuntimeError(
                `Unsupported expression type: ${(expression as Expression).type}`,
            );
    }
}

async function runMemberExpression(
    agent: Agent,
    controller: RuntimeController,
    block: StackFrame,
    frame: StackFrame,
    expression: MemberExpression,
) {
    const objectFrame = getFrame(frame, 0);
    const objectDone = await runExpression(agent, controller, block, objectFrame, expression.obj);
    if (!objectDone) {
        return false;
    }

    let property: string;
    if (expression.prop.type === 'Identifier') {
        property = expression.prop.name;
    } else {
        const propertyFrame = getFrame(frame, 1);
        const propertyDone = await runExpression(
            agent,
            controller,
            block,
            propertyFrame,
            expression.prop,
        );
        if (!propertyDone) {
            return false;
        }

        property = propertyFrame.value as string;
    }

    frame.value = (objectFrame.value as Record<string, unknown>)[property];
    return completeFrame(frame);
}

async function runObjectExpression(
    agent: Agent,
    controller: RuntimeController,
    block: StackFrame,
    frame: StackFrame,
    expression: ObjectExpression,
) {
    const result: Record<string, unknown> = {};

    let index = 0;

    // todo: run in parallel
    for (const prop of expression.props) {
        let key: string;
        if (prop.key.type === 'Identifier') {
            key = prop.key.name;
        } else {
            const keyFrame = getFrame(frame, index);
            const keyDone = await runExpression(agent, controller, block, keyFrame, prop.key);
            if (!keyDone) {
                return false;
            }

            key = keyFrame.value as string;
            index++;
        }

        const valueFrame = getFrame(frame, index);
        const valueDone = await runExpression(agent, controller, block, valueFrame, prop.value);
        if (!valueDone) {
            return false;
        }

        result[key] = valueFrame.value;
        index++;
    }

    frame.value = result;
    return completeFrame(frame);
}

async function runArrayExpression(
    agent: Agent,
    controller: RuntimeController,
    block: StackFrame,
    frame: StackFrame,
    expression: ArrayExpression,
) {
    const result = await runExpressionArray(agent, controller, block, frame, expression.items);
    if (!result) {
        return false;
    }

    frame.value = result;

    return completeFrame(frame);
}

async function runFunctionCall(
    agent: Agent,
    controller: RuntimeController,
    block: StackFrame,
    frame: StackFrame,
    expression: FunctionCall,
) {
    let func: unknown;
    let obj: unknown;

    if (expression.func.type === 'Member') {
        obj = resolveExpression(agent, frame, expression.func.obj);
        const prop = resolveName(agent, frame, expression.func.prop);
        func = (obj as Record<string, unknown>)[prop];
    } else {
        func = resolveExpression(agent, frame, expression.func);
        obj = undefined;
    }

    if (isTool(func)) {
        return await runFunctionCustom(agent, controller, block, frame, expression, func);
    }

    if (typeof func === 'function') {
        return await runFunctionNative(agent, controller, block, frame, expression, func, obj);
    }

    throw new RuntimeError(`Expression is not a function`);
}

async function runFunctionCustom(
    agent: Agent,
    controller: RuntimeController,
    block: StackFrame,
    frame: StackFrame,
    call: FunctionCall,
    tool: ToolDefinition,
) {
    const args = await runExpressionArray(agent, controller, block, frame, call.args);
    if (!args) {
        return false;
    }

    let input: Record<string, unknown> | undefined;
    if (tool.input) {
        if (tool.singleArg) {
            input = args[0] as Record<string, unknown>;
        } else {
            input = {};

            if (s.isSchema(tool.input, s.object)) {
                const argProps = Object.entries(tool.input.props);

                for (let i = 0; i < argProps.length; i++) {
                    const arg = args[i];
                    const argName = argProps[i][0];

                    input[argName] = arg;
                }
            }
        }

        validateOrThrow(tool.input, input);
    }

    // Prepare state for the tool execution
    let state = frame.state as Record<string, unknown> | undefined;
    if (tool.state && !state) {
        state = s.coerce(tool.state) as Record<string, unknown>;
        frame.state = state;
    }

    const events: ToolEvent<unknown>[] = [];
    const result: unknown = tool.handler({
        input,
        state,
        events,
    });

    if (result instanceof Promise) {
        frame.value = await result;
        controller.tick();
    } else {
        frame.value = result;
    }

    return completeFrame(frame);
}

async function runFunctionNative(
    agent: Agent,
    controller: RuntimeController,
    block: StackFrame,
    frame: StackFrame,
    call: FunctionCall,
    func: NativeFunction,
    thisArg: unknown,
) {
    const args = await runExpressionArray(agent, controller, block, frame, call.args);
    if (!args) {
        return false;
    }

    const allowed = allowedNativeFunctions.has(func) || allowedNativeFunctions.has(func.name);
    if (!allowed) {
        throw new RuntimeError(`Function ${func.name} is not allowed`);
    }

    const result = func.apply(thisArg, args) as unknown;
    if (result instanceof Promise) {
        frame.value = await result;
        controller.tick();
    } else {
        frame.value = result;
    }

    return completeFrame(frame);
}

async function runNewExpression(
    agent: Agent,
    controller: RuntimeController,
    block: StackFrame,
    frame: StackFrame,
    expression: NewExpression,
) {
    const constructor = resolveExpression(agent, frame, expression.func) as Constructor;
    if (typeof constructor !== 'function') {
        throw new RuntimeError(`Expression is not a function`);
    }

    if (!allowedNativeFunctions.has(constructor)) {
        throw new RuntimeError(`Constructor ${constructor.name} is not allowed`);
    }

    const args = await runExpressionArray(agent, controller, block, frame, expression.args);
    if (!args) {
        return false;
    }

    frame.value = new constructor(...args);
    return completeFrame(frame);
}

async function runExpressionArray(
    agent: Agent,
    controller: RuntimeController,
    block: StackFrame,
    frame: StackFrame,
    expressions: Expression[],
) {
    const result: unknown[] = [];

    // todo: run in parallel
    for (let i = 0; i < expressions.length; i++) {
        const arg = expressions[i];
        const argFrame = getFrame(frame, i);
        const done = await runExpression(agent, controller, block, argFrame, arg);
        if (!done) {
            return false;
        }

        result.push(argFrame.value);

        if (!controller.continue()) {
            return false;
        }
    }

    return result;
}

function pushNewFrame(parent: StackFrame) {
    if (!parent.children) {
        parent.children = [];
    }

    const frame: StackFrame = { startedAt: Date.now(), parent };
    parent.children.push(frame);

    return {
        frame,
        index: parent.children.length - 1,
    };
}

function getFrame(parent: StackFrame, index: number) {
    if (!parent.children) {
        parent.children = [];
    }

    if (index < parent.children.length) {
        return parent.children[index];
    }

    if (index === parent.children.length) {
        const frame: StackFrame = { startedAt: Date.now(), parent };
        parent.children.push(frame);
        return frame;
    }

    throw new RuntimeError(`Frame index out of bounds: ${index}`);
}

function completeFrame(frame: StackFrame) {
    frame.completedAt = Date.now();
    return true;
}

function setVariable(frame: StackFrame, name: string, value: unknown) {
    do {
        const variables = frame.variables;
        if (variables && name in variables) {
            variables[name] = value;
            return;
        }
        if (!frame.parent) {
            throw new RuntimeError(`Variable ${name} not found`);
        }

        frame = frame.parent;
    } while (frame);
}

function resolveExpression(agent: Agent, frame: StackFrame, expression: Expression): unknown {
    switch (expression.type) {
        case 'Identifier': {
            return resolveIdentifier(agent, frame, expression);
        }

        case 'Literal': {
            return resolveLiteral(expression);
        }

        case 'Member': {
            const object = resolveExpression(agent, frame, expression.obj);
            const property = resolveName(agent, frame, expression.prop);

            return (object as Record<string, unknown>)[property];
        }

        default:
            throw new RuntimeError(`Unsupported expression type: ${expression.type}`);
    }
}

function resolveLiteral(expression: Literal) {
    const value = expression.value;
    if (typeof value === 'object') {
        return JSON.parse(JSON.stringify(value)) as unknown;
    }

    return value;
}

function resolveName(agent: Agent, frame: StackFrame, expression: Expression) {
    if (expression.type === 'Identifier') {
        return expression.name;
    }

    return resolveExpression(agent, frame, expression) as string;
}

function resolveIdentifier(agent: Agent, frame: StackFrame, expression: Identifier) {
    const name = expression.name;

    while (frame) {
        const variables = frame.variables;
        if (variables && name in variables) {
            return variables[name];
        }

        if (frame.parent) {
            frame = frame.parent;
            continue;
        }

        break;
    }

    const tools = agent.tools;
    if (name in tools) {
        return tools[name];
    }

    if (allowedNativeIdentifiers.has(name)) {
        return (globalThis as Record<string, unknown>)[name];
    }

    throw new RuntimeError(`Variable ${expression.name} not found`);
}
