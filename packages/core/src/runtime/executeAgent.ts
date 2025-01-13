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
    OperatorExpression,
} from '../parser/astTypes.js';
import { isTool } from '../tools/defineTool.js';
import type { ToolDefinition } from '../tools/defineTool.js';
import {
    resolveExpression,
    resolveFunctionCall,
    resolveIdentifier,
    resolveLiteral,
} from './utils/resolveExpression.js';
import { TOOL_AWAIT_RESULT, toolResultHelper } from '../tools/toolResult.js';

type ExecuteAgentInputOptions<TInput extends AgentInputBase> = TInput extends EmptyObject
    ? {
          /** Input for the agent. */
          input?: undefined;
      }
    : {
          /** Input for the agent. */
          input: AgentInput<TInput>;
      };

type AgentVisitParams = {
    /**
     * Execution frame being visited.
     */
    frame: StackFrame;
    /**
     * AST node being visited.
     */
    node: AstNode;
    /**
     * Agent being executed.
     */
    agent: Agent;
};

type AgentVisitCallback = (params: AgentVisitParams) => void;

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

    /**
     * Callback for visiting a node during execution.
     * This is an internal API used for testing and may change.
     * @internal
     */
    onVisit?: AgentVisitCallback;
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

    const root = agent.root;
    const script = agent.script.ast;
    const status = await runBlock(agent, controller, options.onVisit, root, script);

    agent.status = status;

    if (status === 'finished' && agent.def.output) {
        const result = root.variables?.result as AgentOutput<TOutput>;
        validateOrThrow(agent.def.output, result);
        agent.output = result;
    }

    return { ticks: controller.ticks };
}

async function runBlock(
    agent: Agent,
    controller: RuntimeController,
    onVisit: AgentVisitCallback | undefined,
    block: StackFrame,
    nodes: AstNode[],
): Promise<StackFrameStatus> {
    if (block.status === 'finished') {
        return 'finished';
    }

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
        const frameStatus = await runNode(agent, controller, onVisit, block, frame, node);
        if (frameStatus !== 'finished') {
            return updateFrame(block, frameStatus);
        }

        index++;
    }
}

async function runNode(
    agent: Agent,
    controller: RuntimeController,
    onVisit: AgentVisitCallback | undefined,
    block: StackFrame,
    frame: StackFrame,
    node: AstNode,
): Promise<StackFrameStatus> {
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
            const status = await runExpression(
                agent,
                controller,
                onVisit,
                block,
                valueFrame,
                node.value,
            );

            if (status !== 'finished') {
                return updateFrame(frame, status);
            }

            block.variables[name] = valueFrame.value;
            return updateFrame(frame, 'finished');
        }

        default:
            return await runExpression(agent, controller, onVisit, block, frame, node);
    }
}

async function runExpression(
    agent: Agent,
    controller: RuntimeController,
    onVisit: AgentVisitCallback | undefined,
    block: StackFrame,
    frame: StackFrame,
    expression: Expression,
): Promise<StackFrameStatus> {
    if (frame.status === 'finished') {
        return 'finished';
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

        case 'member':
            return await runMemberExpression(agent, controller, onVisit, block, frame, expression);

        case 'operator':
            return await runOperatorExpression(
                agent,
                controller,
                onVisit,
                block,
                frame,
                expression,
            );

        case 'obj':
            return await runObjectExpression(agent, controller, onVisit, block, frame, expression);

        case 'arr':
            return await runArrayExpression(agent, controller, onVisit, block, frame, expression);

        case 'assign': {
            const rightFrame = getFrame(frame, 0);

            const status = await runExpression(
                agent,
                controller,
                onVisit,
                block,
                rightFrame,
                expression.right,
            );

            if (status !== 'finished') {
                return updateFrame(frame, status);
            }

            if (expression.left.type === 'ident') {
                setVariable(block, expression.left.name, rightFrame.value);
                return updateFrame(frame, 'finished');
            }

            throw new Error('Assignment left must be a variable');
        }

        case 'call':
            return await runFunctionCall(agent, controller, onVisit, block, frame, expression);

        case 'new':
            return await runNewExpression(agent, controller, onVisit, block, frame, expression);

        default:
            throw new RuntimeError(
                `Unsupported expression type: ${(expression as Expression).type}`,
            );
    }
}

async function runMemberExpression(
    agent: Agent,
    controller: RuntimeController,
    onVisit: AgentVisitCallback | undefined,
    block: StackFrame,
    frame: StackFrame,
    expression: MemberExpression,
): Promise<StackFrameStatus> {
    const objectFrame = getFrame(frame, 0);
    const objectStatus = await runExpression(
        agent,
        controller,
        onVisit,
        block,
        objectFrame,
        expression.obj,
    );

    if (objectStatus !== 'finished') {
        return updateFrame(frame, objectStatus);
    }

    let property: string;
    if (expression.prop.type === 'ident') {
        property = expression.prop.name;
    } else {
        const propertyFrame = getFrame(frame, 1);
        const propertyStatus = await runExpression(
            agent,
            controller,
            onVisit,
            block,
            propertyFrame,
            expression.prop,
        );

        if (propertyStatus !== 'finished') {
            return updateFrame(frame, propertyStatus);
        }

        property = propertyFrame.value as string;
    }

    frame.value = (objectFrame.value as Record<string, unknown>)[property];
    return updateFrame(frame, 'finished');
}

async function runObjectExpression(
    agent: Agent,
    controller: RuntimeController,
    onVisit: AgentVisitCallback | undefined,
    block: StackFrame,
    frame: StackFrame,
    expression: ObjectExpression,
): Promise<StackFrameStatus> {
    const result: Record<string, unknown> = {};

    let index = 0;

    // todo: run in parallel
    for (const prop of expression.props) {
        let key: string;
        if (prop.key.type === 'ident') {
            key = prop.key.name;
        } else {
            const keyFrame = getFrame(frame, index);
            const keyStatus = await runExpression(
                agent,
                controller,
                onVisit,
                block,
                keyFrame,
                prop.key,
            );

            if (keyStatus !== 'finished') {
                return updateFrame(frame, keyStatus);
            }

            key = keyFrame.value as string;
            index++;
        }

        const valueFrame = getFrame(frame, index);
        const valueStatus = await runExpression(
            agent,
            controller,
            onVisit,
            block,
            valueFrame,
            prop.value,
        );

        if (valueStatus !== 'finished') {
            return updateFrame(frame, valueStatus);
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
    onVisit: AgentVisitCallback | undefined,
    block: StackFrame,
    frame: StackFrame,
    expression: ArrayExpression,
) {
    const result = await runExpressionArray(
        agent,
        controller,
        onVisit,
        block,
        frame,
        expression.items,
    );

    if (Array.isArray(result)) {
        frame.value = result;
        return updateFrame(frame, 'finished');
    }

    return updateFrame(frame, result);
}

async function runFunctionCall(
    agent: Agent,
    controller: RuntimeController,
    onVisit: AgentVisitCallback | undefined,
    block: StackFrame,
    frame: StackFrame,
    expression: FunctionCall,
): Promise<StackFrameStatus> {
    const { func, obj } = resolveFunctionCall(agent, frame, expression);

    if (isTool(func)) {
        return await runFunctionCustom(agent, controller, onVisit, block, frame, expression, func);
    }

    if (typeof func === 'function') {
        return await runFunctionNative(
            agent,
            controller,
            onVisit,
            block,
            frame,
            expression,
            func,
            obj,
        );
    }

    throw new RuntimeError(`Expression is not a function`);
}

async function runFunctionCustom(
    agent: Agent,
    controller: RuntimeController,
    onVisit: AgentVisitCallback | undefined,
    block: StackFrame,
    frame: StackFrame,
    call: FunctionCall,
    tool: ToolDefinition,
): Promise<StackFrameStatus> {
    const args = await runExpressionArray(agent, controller, onVisit, block, frame, call.args);
    if (!Array.isArray(args)) {
        return updateFrame(frame, args);
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
    let result: unknown = tool.handler({
        input,
        state,
        events,
        trace: frame.trace,
        agent,
        result: toolResultHelper,
    });

    if (result instanceof Promise) {
        result = await result;
        controller.tick();
    }

    if (result === TOOL_AWAIT_RESULT) {
        return updateFrame(frame, 'awaiting');
    }

    frame.value = result;
    return updateFrame(frame, 'finished');
}

async function runFunctionNative(
    agent: Agent,
    controller: RuntimeController,
    onVisit: AgentVisitCallback | undefined,
    block: StackFrame,
    frame: StackFrame,
    call: FunctionCall,
    func: NativeFunction,
    thisArg: unknown,
) {
    const args = await runExpressionArray(agent, controller, onVisit, block, frame, call.args);
    if (!Array.isArray(args)) {
        return updateFrame(frame, args);
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

async function runOperatorExpression(
    agent: Agent,
    controller: RuntimeController,
    onVisit: AgentVisitCallback | undefined,
    block: StackFrame,
    frame: StackFrame,
    expression: OperatorExpression,
) {
    let frameIndex = 0;

    let leftFrame: StackFrame | undefined;
    let rightFrame: StackFrame | undefined;

    if (expression.left) {
        leftFrame = getFrame(frame, frameIndex++);
        const leftStatus = await runExpression(
            agent,
            controller,
            onVisit,
            block,
            leftFrame,
            expression.left,
        );

        if (leftStatus !== 'finished') {
            return updateFrame(frame, leftStatus);
        }
    }

    if (expression.right) {
        rightFrame = getFrame(frame, frameIndex++);
        const rightStatus = await runExpression(
            agent,
            controller,
            onVisit,
            block,
            rightFrame,
            expression.right,
        );

        if (rightStatus !== 'finished') {
            return updateFrame(frame, rightStatus);
        }
    }

    switch (expression.operator) {
        case '+':
            frame.value = (leftFrame?.value as number) + (rightFrame?.value as number);
            break;

        case '-':
            frame.value = (leftFrame?.value as number) - (rightFrame?.value as number);
            break;

        case '*':
            frame.value = (leftFrame?.value as number) * (rightFrame?.value as number);
            break;

        case '/':
            frame.value = (leftFrame?.value as number) / (rightFrame?.value as number);
            break;

        case '%':
            frame.value = (leftFrame?.value as number) % (rightFrame?.value as number);
            break;

        case '==':
            frame.value = (leftFrame?.value as number) == (rightFrame?.value as number);
            break;

        case '===':
            frame.value = (leftFrame?.value as number) === (rightFrame?.value as number);
            break;

        case '!=':
            frame.value = (leftFrame?.value as number) != (rightFrame?.value as number);
            break;

        case '!==':
            frame.value = (leftFrame?.value as number) !== (rightFrame?.value as number);
            break;

        case '>':
            frame.value = (leftFrame?.value as number) > (rightFrame?.value as number);
            break;

        case '>=':
            frame.value = (leftFrame?.value as number) >= (rightFrame?.value as number);
            break;

        case '<':
            frame.value = (leftFrame?.value as number) < (rightFrame?.value as number);
            break;

        case '<=':
            frame.value = (leftFrame?.value as number) <= (rightFrame?.value as number);
            break;

        case '&&':
            frame.value = (leftFrame?.value as boolean) && (rightFrame?.value as boolean);
            break;

        case '||':
            frame.value = (leftFrame?.value as boolean) || (rightFrame?.value as boolean);
            break;

        case '??':
            frame.value = leftFrame?.value ?? rightFrame?.value;
            break;

        default:
            throw new RuntimeError(`Unsupported operator: ${expression.operator as string}`);
    }

    return updateFrame(frame, 'finished');
}

async function runNewExpression(
    agent: Agent,
    controller: RuntimeController,
    onVisit: AgentVisitCallback | undefined,
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

    const args = await runExpressionArray(
        agent,
        controller,
        onVisit,
        block,
        frame,
        expression.args,
    );

    if (Array.isArray(args)) {
        frame.value = new constructor(...args);
        return updateFrame(frame, 'finished');
    }

    return updateFrame(frame, args);
}

async function runExpressionArray(
    agent: Agent,
    controller: RuntimeController,
    onVisit: AgentVisitCallback | undefined,
    block: StackFrame,
    frame: StackFrame,
    expressions: Expression[],
) {
    const result: unknown[] = [];

    // todo: run in parallel
    for (let i = 0; i < expressions.length; i++) {
        const arg = expressions[i];
        const argFrame = getFrame(frame, i);
        const argStatus = await runExpression(agent, controller, onVisit, block, argFrame, arg);
        if (argStatus !== 'finished') {
            return updateFrame(frame, argStatus);
        }

        result.push(argFrame.value);

        if (!controller.continue()) {
            return updateFrame(frame, 'running');
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

    return status;
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
