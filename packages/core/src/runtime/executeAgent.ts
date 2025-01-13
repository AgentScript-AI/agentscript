import type { Constructor, EmptyObject } from '@nzyme/types';

import * as s from '@agentscript-ai/schema';
import { validateOrThrow } from '@agentscript-ai/schema';

import { RuntimeError } from './RuntimeError.js';
import type { NativeFunction } from './common.js';
import { allowedNativeFunctions } from './common.js';
import type { Agent as Agent } from './createAgent.js';
import type { RuntimeController, RuntimeControllerOptions } from './runtimeController.js';
import { createRuntimeControler } from './runtimeController.js';
import type { StackFrame, StackFrameStatus } from './runtimeTypes.js';
import type {
    AgentInput,
    AgentInputBase,
    AgentOutput,
    AgentOutputBase,
    AgentTools,
} from '../defineAgent.js';
import type {
    ArrayExpression,
    AstNode,
    Expression,
    FunctionCall,
    MemberExpression,
    NewExpression,
    ObjectExpression,
} from '../parser/astTypes.js';
import { isTool } from '../tools/defineTool.js';
import type { ToolDefinition } from '../tools/defineTool.js';
import {
    resolveExpression,
    resolveFunctionCall,
    resolveIdentifier,
    resolveLiteral,
} from './utils/resolveExpression.js';
import { toolResultHelper } from '../tools/toolResult.js';

type ExecuteAgentInputOptions<TInput extends AgentInputBase> = TInput extends EmptyObject
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
    const startedAt = new Date();
    if (!agent.state) {
        agent.state = {
            complete: false,
            root: {
                trace: '0',
                startedAt,
                updatedAt: startedAt,
                status: 'running',
            },
        };

        if (agent.output) {
            agent.state.root.variables = {
                result: undefined,
            };
        }
    }

    const root = agent.state.root;
    const script = agent.script.ast;

    if (root.status === 'finished') {
        return { ticks: controller.ticks, done: true };
    }

    const result = await runBlock(agent, controller, root, script);

    const frames = root.children;
    if (frames?.length === script.length && frames[frames.length - 1].status === 'finished') {
        updateFrame(root, 'finished');
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
    nodes: AstNode[],
) {
    if (!block.children) {
        block.children = [];
    }

    const stack = block.children;
    let index = stack.length - 1;
    let frame: StackFrame | undefined;

    while (true) {
        if (index >= nodes.length) {
            // went through all statements in block
            return updateFrame(block, 'finished');
        }

        if (!controller.continue()) {
            return updateFrame(block, 'running');
        }

        frame = stack[index];
        if (!frame) {
            ({ frame, index } = pushNewFrame(block));
        }

        if (frame.status === 'finished') {
            index++;
            continue;
        }

        const node = nodes[index];
        const frameDone = await runNode(agent, controller, block, frame, node);
        if (!frameDone) {
            return updateFrame(frame, 'running');
        }

        index++;
    }
}

async function runNode(
    agent: Agent,
    controller: RuntimeController,
    block: StackFrame,
    frame: StackFrame,
    node: AstNode,
) {
    switch (node.type) {
        case 'var': {
            const name = node.name;

            if (!block.variables) {
                block.variables = {};
            }

            if (name in block.variables) {
                throw new RuntimeError(`Variable ${name} already exists`);
            }

            if (!node.value) {
                block.variables[name] = undefined;
                return updateFrame(frame, 'finished');
            }

            const valueFrame = getFrame(frame, 0);
            const done = await runExpression(agent, controller, block, valueFrame, node.value);
            if (!done) {
                return updateFrame(frame, 'running');
            }

            block.variables[name] = valueFrame.value;
            return updateFrame(frame, 'finished');
        }

        default:
            return await runExpression(agent, controller, block, frame, node);
    }
}

async function runExpression(
    agent: Agent,
    controller: RuntimeController,
    block: StackFrame,
    frame: StackFrame,
    expression: Expression,
): Promise<boolean> {
    if (frame.status === 'finished') {
        return true;
    }

    switch (expression.type) {
        case 'ident': {
            frame.value = resolveIdentifier(agent, frame, expression);
            return updateFrame(frame, 'finished');
        }

        case 'literal': {
            frame.value = resolveLiteral(expression);
            return updateFrame(frame, 'finished');
        }

        case 'member': {
            return await runMemberExpression(agent, controller, block, frame, expression);
        }

        case 'obj': {
            return await runObjectExpression(agent, controller, block, frame, expression);
        }

        case 'arr': {
            return await runArrayExpression(agent, controller, block, frame, expression);
        }

        case 'assign': {
            const rightFrame = getFrame(frame, 0);

            const result = await runExpression(
                agent,
                controller,
                block,
                rightFrame,
                expression.right,
            );
            if (!result) {
                return updateFrame(frame, 'running');
            }

            if (expression.left.type === 'ident') {
                setVariable(block, expression.left.name, rightFrame.value);
                return updateFrame(frame, 'finished');
            }

            throw new Error('Assignment left must be a variable');
        }

        case 'call': {
            return await runFunctionCall(agent, controller, block, frame, expression);
        }

        case 'new': {
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
        return updateFrame(frame, 'running');
    }

    let property: string;
    if (expression.prop.type === 'ident') {
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
            return updateFrame(frame, 'running');
        }

        property = propertyFrame.value as string;
    }

    frame.value = (objectFrame.value as Record<string, unknown>)[property];
    return updateFrame(frame, 'finished');
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
        if (prop.key.type === 'ident') {
            key = prop.key.name;
        } else {
            const keyFrame = getFrame(frame, index);
            const keyDone = await runExpression(agent, controller, block, keyFrame, prop.key);
            if (!keyDone) {
                return updateFrame(frame, 'running');
            }

            key = keyFrame.value as string;
            index++;
        }

        const valueFrame = getFrame(frame, index);
        const valueDone = await runExpression(agent, controller, block, valueFrame, prop.value);
        if (!valueDone) {
            return updateFrame(frame, 'running');
        }

        result[key] = valueFrame.value;
        index++;
    }

    frame.value = result;
    return updateFrame(frame, 'finished');
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
        return updateFrame(frame, 'running');
    }

    frame.value = result;

    return updateFrame(frame, 'finished');
}

async function runFunctionCall(
    agent: Agent,
    controller: RuntimeController,
    block: StackFrame,
    frame: StackFrame,
    expression: FunctionCall,
) {
    const { func, obj } = resolveFunctionCall(agent, frame, expression);

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
        return updateFrame(frame, 'running');
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

    const events = frame.events?.filter(e => !e.processed) || [];
    const result: unknown = tool.handler({
        input,
        state,
        events,
        trace: frame.trace,
        agent,
        result: toolResultHelper,
    });

    if (result instanceof Promise) {
        frame.value = await result;
        controller.tick();
    } else {
        frame.value = result;
    }

    return updateFrame(frame, 'finished');
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
        return updateFrame(frame, 'running');
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

    return updateFrame(frame, 'finished');
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
        return updateFrame(frame, 'running');
    }

    frame.value = new constructor(...args);
    return updateFrame(frame, 'finished');
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
            return updateFrame(frame, 'running') as false;
        }

        result.push(argFrame.value);

        if (!controller.continue()) {
            return updateFrame(frame, 'running') as false;
        }
    }

    return result;
}

function pushNewFrame(parent: StackFrame) {
    if (!parent.children) {
        parent.children = [];
    }

    const startedAt = new Date();

    const frame: StackFrame = {
        startedAt,
        updatedAt: startedAt,
        parent,
        trace: `${parent.trace}:${parent.children.length}`,
        status: 'running',
    };

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
        const startedAt = new Date();

        const frame: StackFrame = {
            startedAt,
            updatedAt: startedAt,
            parent,
            trace: `${parent.trace}:${index}`,
            status: 'running',
        };
        parent.children.push(frame);
        return frame;
    }

    throw new RuntimeError(`Frame index out of bounds: ${index}`);
}

function updateFrame(frame: StackFrame, status: StackFrameStatus) {
    frame.updatedAt = new Date();
    frame.status = status;

    return status === 'finished';
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
