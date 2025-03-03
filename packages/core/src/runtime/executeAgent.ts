import { type Container, resolveDeps } from '@nzyme/ioc';
import type { Constructor, EmptyObject } from '@nzyme/types';
import { assert } from '@nzyme/utils';

import type {
    ArrayExpression,
    AssignmentExpression,
    AstNode,
    BinaryExpression,
    BreakStatement,
    Expression,
    FunctionCall,
    IdentifierExpression,
    IfStatement,
    LiteralExpression,
    LogicalExpression,
    MemberExpression,
    NewExpression,
    ObjectExpression,
    RegexExpression,
    ReturnStatement,
    SpreadExpression,
    TemplateLiteral,
    TernaryExpression,
    UnaryExpression,
    UpdateExpression,
    VariableDeclaration,
    WhileStatement,
} from '@agentscript-ai/parser';
import * as s from '@agentscript-ai/schema';
import { validateOrThrow } from '@agentscript-ai/schema';

import { RuntimeError } from './RuntimeError.js';
import type { NativeFunction } from './common.js';
import { ALLOWED_FUNCTIONS, ALLOWED_GLOBALS } from './common.js';
import type { RuntimeController, RuntimeControllerOptions } from './runtimeController.js';
import { createRuntimeControler } from './runtimeController.js';
import type { StackFrame, StackFrameStatus } from './runtimeTypes.js';
import type { Agent } from '../agent/agentTypes.js';
import type {
    AgentInput,
    AgentInputBase,
    AgentOutput,
    AgentOutputBase,
    AgentTools,
} from '../agent/defineAgent.js';
import { isTool } from '../tools/defineTool.js';
import type { ToolDefinition } from '../tools/defineTool.js';
import { TOOL_AWAIT_RESULT, toolResultHelper } from '../tools/toolResult.js';
import { resolveExpression, resolveLiteral } from './utils/resolveExpression.js';

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

    /**
     * IOC container to use for the agent execution.
     * Will be used to resolve tools dependencies.
     */
    container?: Container;
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

interface ExecuteAgentContext {
    agent: Agent;
    controller: RuntimeController;
    container?: Container;
}

interface StackFrameResult {
    /**
     * Value of the frame.
     */
    value?: unknown;
    /**
     * Status of the frame.
     */
    status: StackFrameStatus;

    /**
     * Unsafe value of the frame.
     */
    unsafe?: boolean;

    /**
     * Used only for member expressions.
     */
    object?: unknown;
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
    const ctx: ExecuteAgentContext = {
        agent,
        controller,
        container: options.container,
    };

    const result = await runBlockStatement(ctx, root, root, script);

    agent.status = result.status;

    if (result.status === 'done' && agent.def.output) {
        const result = root.variables?.result as AgentOutput<TOutput>;
        validateOrThrow(agent.def.output, result);
        agent.output = result;
    }

    return { ticks: controller.ticks };
}

async function runBlockStatement(
    ctx: ExecuteAgentContext,
    closure: StackFrame,
    block: StackFrame,
    nodes: AstNode[],
): Promise<StackFrameResult> {
    if (!block.children) {
        block.children = [];
    }

    let index = Math.max(0, block.children.length - 1);
    let frame: StackFrame | undefined | null;

    while (true) {
        // block can be completed early by a return statement
        if (block.status === 'done') {
            return block;
        }

        const node = nodes[index];
        if (!node) {
            // went through all statements in block
            return updateFrame(block, 'done');
        }

        if (!ctx.controller.continue()) {
            return block;
        }

        frame = block.children[index];
        if (frame?.status === 'done') {
            index++;
            continue;
        }

        const frameResult = await runNode(ctx, closure, block, index, node);
        if (frameResult.status !== 'done') {
            return updateFrame(block, frameResult.status);
        }

        index++;
    }
}

async function runNode(
    ctx: ExecuteAgentContext,
    closure: StackFrame,
    parent: StackFrame,
    index: number,
    node: AstNode,
): Promise<StackFrameResult> {
    switch (node.type) {
        case 'var':
            return await runVarStatement(ctx, closure, parent, index, node);

        case 'block': {
            const frame = getFrame(parent, index, node);
            return await runBlockStatement(ctx, closure, frame, node.body);
        }

        case 'if':
            return await runIfStatement(ctx, closure, parent, index, node);

        case 'while':
            return await runWhileStatement(ctx, closure, parent, index, node);

        case 'break':
            return runBreakStatement(parent, index, node);

        case 'return':
            return await runReturnStatement(ctx, closure, parent, index, node);

        default:
            return await runExpression(ctx, closure, parent, index, node);
    }
}

async function runVarStatement(
    ctx: ExecuteAgentContext,
    closure: StackFrame,
    parent: StackFrame,
    index: number,
    node: VariableDeclaration,
): Promise<StackFrameResult> {
    const frame = getFrame(parent, index, node);
    if (isDone(frame)) {
        return frame;
    }

    const name = node.name;

    if (!parent.variables) {
        parent.variables = {};
    }

    if (name in parent.variables) {
        throw new RuntimeError(`Variable ${name} already exists`);
    }

    if (!node.value) {
        parent.variables[name] = undefined;
        return updateFrame(frame, 'done');
    }

    const valueResult = await runExpression(ctx, closure, frame, 0, node.value);
    if (valueResult.status !== 'done') {
        return updateFrame(frame, valueResult.status);
    }

    if (valueResult.unsafe) {
        throw new RuntimeError('Assigning unsafe value to variable is not allowed');
    }

    parent.variables[name] = valueResult.value;
    return updateFrame(frame, 'done');
}

async function runIfStatement(
    ctx: ExecuteAgentContext,
    closure: StackFrame,
    parent: StackFrame,
    index: number,
    node: IfStatement,
) {
    const frame = getFrame(parent, index, node);
    if (isDone(frame)) {
        return frame;
    }

    const condition = await runExpression(ctx, closure, frame, 0, node.if);
    if (condition.status !== 'done') {
        return updateFrame(frame, condition.status);
    }

    const thenNode = condition.value ? node.then : node.else;
    if (thenNode) {
        const thenResult = await runNode(ctx, closure, frame, 1, thenNode);
        return updateFrame(frame, thenResult.status);
    }

    return updateFrame(frame, 'done');
}

async function runWhileStatement(
    ctx: ExecuteAgentContext,
    closure: StackFrame,
    parent: StackFrame,
    index: number,
    node: WhileStatement,
) {
    const frame = getFrame(parent, index, node);
    if (isDone(frame)) {
        return frame;
    }

    // child frames are alterating condition and body blocks
    let i = frame.children?.length ?? 0;
    if (i % 2 !== 0) {
        // normalize to the condition frame
        i--;
    }

    while (true) {
        if (isDone(frame)) {
            return frame;
        }

        if (!ctx.controller.continue()) {
            return frame;
        }

        const ticks = ctx.controller.ticks;
        const condition = await runExpression(ctx, closure, frame, i++, node.if);
        if (condition.status !== 'done') {
            return updateFrame(frame, condition.status);
        }

        if (!condition.value) {
            return updateFrame(frame, 'done');
        }

        const body = await runNode(ctx, closure, frame, i++, node.body);
        if (body.status !== 'done') {
            return updateFrame(frame, body.status);
        }

        if (ctx.controller.ticks === ticks) {
            ctx.controller.tick();
        }
    }
}

function runBreakStatement(parent: StackFrame, index: number, node: BreakStatement) {
    const frame = getFrame(parent, index, node);

    while (true) {
        updateFrame(parent, 'done');

        if (parent.node?.type === 'while') {
            break;
        }

        if (!parent.parent) {
            throw new RuntimeError('Break statement outside of loop');
        }

        parent = parent.parent;
    }

    return updateFrame(frame, 'done');
}

async function runExpression(
    ctx: ExecuteAgentContext,
    closure: StackFrame,
    parent: StackFrame,
    index: number,
    expr: Expression,
): Promise<StackFrameResult> {
    switch (expr.type) {
        case 'ident':
            return runIdentifierExpression(ctx, parent, index, expr);

        case 'literal':
            return runLiteralExpression(parent, index, expr);

        case 'member':
            return await runMemberExpression(ctx, closure, parent, index, expr);

        case 'binary':
            return await runBinaryExpression(ctx, closure, parent, index, expr);

        case 'logical':
            return await runLogicalExpression(ctx, closure, parent, index, expr);

        case 'unary':
            return await runUnaryExpression(ctx, closure, parent, index, expr);

        case 'update':
            return await runUpdateExpression(ctx, closure, parent, index, expr);

        case 'ternary':
            return await runTernaryExpression(ctx, closure, parent, index, expr);

        case 'object':
            return await runObjectExpression(ctx, closure, parent, index, expr);

        case 'array':
            return await runArrayExpression(ctx, closure, parent, index, expr);

        case 'assign':
            return await runAssignExpression(ctx, closure, parent, index, expr);

        case 'call':
            return await runFunctionCall(ctx, closure, parent, index, expr);

        case 'new':
            return await runNewExpression(ctx, closure, parent, index, expr);

        case 'template':
            return await runTemplateLiteral(ctx, closure, parent, index, expr);

        case 'regex':
            return runRegexExpression(parent, index, expr);

        default:
            throw new RuntimeError(`Unsupported expression type: ${(expr as Expression).type}`);
    }
}

function runIdentifierExpression(
    ctx: ExecuteAgentContext,
    parent: StackFrame,
    index: number,
    expr: IdentifierExpression,
): StackFrameResult {
    const name = expr.name;

    let variableFrame: StackFrame | undefined = parent;
    while (variableFrame) {
        const variables = variableFrame.variables;
        if (variables && name in variables) {
            const frame = getFrame(parent, index, expr);

            frame.value = variables[name];
            return updateFrame(frame, 'done');
        }

        variableFrame = variableFrame.parent;
    }

    const tools = ctx.agent.def.tools;
    if (tools && name in tools) {
        return {
            status: 'done',
            value: tools[name],
            unsafe: true,
        };
    }

    if (ALLOWED_GLOBALS.has(name)) {
        return {
            value: (globalThis as Record<string, unknown>)[name],
            unsafe: true,
            status: 'done',
        };
    }

    throw new RuntimeError(`Variable ${expr.name} not found`);
}

function runLiteralExpression(
    parent: StackFrame,
    index: number,
    expr: LiteralExpression,
): StackFrameResult {
    let frame = parent.children?.[index];
    if (frame?.status === 'done') {
        return frame;
    }

    const value = resolveLiteral(expr);

    // if literal is a reference type, we need to create stack frame to preserve references correctly
    if (value !== null && typeof value === 'object') {
        frame = getFrame(parent, index, expr);
        frame.value = value;

        return updateFrame(frame, 'done');
    }

    return {
        value,
        status: 'done',
    };
}

async function runMemberExpression(
    ctx: ExecuteAgentContext,
    closure: StackFrame,
    parent: StackFrame,
    index: number,
    expr: MemberExpression,
): Promise<StackFrameResult> {
    const frame = getFrame(parent, index, expr);
    if (frame.status === 'done' && frame.value !== undefined) {
        return frame;
    }

    const objectResult = await runExpression(ctx, closure, frame, 0, expr.obj);
    if (objectResult.status !== 'done') {
        return updateFrame(frame, objectResult.status);
    }

    let property: string;
    let unsafe = objectResult.unsafe;
    if (typeof expr.prop === 'string') {
        property = expr.prop;
    } else {
        const propertyResult = await runExpression(ctx, closure, frame, 1, expr.prop);

        if (propertyResult.status !== 'done') {
            return updateFrame(frame, propertyResult.status);
        }

        property = String(propertyResult.value);
        unsafe = unsafe || propertyResult.unsafe;
    }

    const value = (objectResult.value as Record<string, unknown>)[property];

    unsafe = unsafe || !isSafeValue(value);

    // only set value if it's safe
    if (!unsafe) {
        frame.value = value;
    }

    updateFrame(frame, 'done');

    return {
        value,
        unsafe,
        status: 'done',
        object: objectResult.value,
    };
}

async function runObjectExpression(
    ctx: ExecuteAgentContext,
    closure: StackFrame,
    parent: StackFrame,
    index: number,
    expr: ObjectExpression,
): Promise<StackFrameResult> {
    const frame = getFrame(parent, index, expr);
    const result: Record<string, unknown> = {};

    let propIndex = 0;

    // todo: run in parallel
    for (const prop of expr.props) {
        // handle spread
        if (prop.type === 'spread') {
            const spreadResult = await runExpression(ctx, closure, frame, propIndex, prop.value);

            if (spreadResult.status !== 'done') {
                return updateFrame(frame, spreadResult.status);
            }

            Object.assign(result, spreadResult.value);
            propIndex++;
            continue;
        }

        // handle normal prop
        let key: string;
        if (prop.key.type === 'ident') {
            key = prop.key.name;
        } else {
            const keyResult = await runExpression(ctx, closure, frame, propIndex, prop.key);

            if (keyResult.status !== 'done') {
                return updateFrame(frame, keyResult.status);
            }

            key = keyResult.value as string;
            propIndex++;
        }

        const valueResult = await runExpression(ctx, closure, frame, propIndex, prop.value);

        if (valueResult.status !== 'done') {
            return updateFrame(frame, valueResult.status);
        }

        result[key] = valueResult.value;
        propIndex++;
    }

    frame.value = result;
    return updateFrame(frame, 'done');
}

async function runArrayExpression(
    ctx: ExecuteAgentContext,
    closure: StackFrame,
    parent: StackFrame,
    index: number,
    expr: ArrayExpression,
) {
    const frame = getFrame(parent, index, expr);
    if (isDone(frame)) {
        return frame;
    }

    const result = await runExpressionArray(ctx, closure, frame, 0, expr.items);

    if (Array.isArray(result)) {
        frame.value = result;
        return updateFrame(frame, 'done');
    }

    return updateFrame(frame, result);
}

async function runAssignExpression(
    ctx: ExecuteAgentContext,
    closure: StackFrame,
    parent: StackFrame,
    index: number,
    expr: AssignmentExpression,
): Promise<StackFrameResult> {
    const frame = getFrame(parent, index, expr);
    if (isDone(frame)) {
        return frame;
    }

    const right = await runExpression(ctx, closure, frame, 0, expr.right);
    if (right.status !== 'done') {
        return updateFrame(frame, right.status);
    }

    if (right.unsafe) {
        throw new RuntimeError('Assigning unsafe value is not allowed');
    }

    switch (expr.left.type) {
        case 'ident':
            setVariable(parent, expr.left.name, right.value);
            frame.value = right.value;
            return updateFrame(frame, 'done');
        case 'member': {
            const obj = await runExpression(ctx, closure, frame, 1, expr.left.obj);
            if (obj.status !== 'done') {
                return updateFrame(frame, obj.status);
            }

            if (obj.unsafe) {
                throw new RuntimeError('Assigning to unsafe value is not allowed');
            }

            if (typeof expr.left.prop === 'string') {
                // property is a simple identifier
                (obj.value as Record<string, unknown>)[expr.left.prop] = right.value;
            } else {
                // property is an expression
                const key = await runExpression(ctx, closure, frame, 2, expr.left.prop);

                if (key.status !== 'done') {
                    return updateFrame(frame, key.status);
                }

                (obj.value as Record<string, unknown>)[key.value as string] = right.value;
            }

            frame.value = right.value;
            return updateFrame(frame, 'done');
        }
        default:
            throw new RuntimeError(`Unsupported assignment left: ${expr.left.type}`);
    }
}

async function runFunctionCall(
    ctx: ExecuteAgentContext,
    closure: StackFrame,
    parent: StackFrame,
    index: number,
    expr: FunctionCall,
): Promise<StackFrameResult> {
    const frame = getFrame(parent, index, expr);
    if (isDone(frame)) {
        return frame;
    }

    let func: unknown;
    let obj: Record<string, unknown> | undefined;

    if (expr.func.type === 'member') {
        if (typeof expr.func.prop !== 'string') {
            throw new RuntimeError('Dynamic method calls are not supported');
        }

        const objResult = await runExpression(ctx, closure, frame, 0, expr.func.obj);
        if (objResult.status !== 'done') {
            return updateFrame(frame, objResult.status);
        }

        obj = objResult.value as Record<string, unknown>;
        func = obj[expr.func.prop];
    } else {
        const funcResult = await runExpression(ctx, closure, frame, 0, expr.func);
        if (funcResult.status !== 'done') {
            return updateFrame(frame, funcResult.status);
        }

        func = funcResult.value;
        obj = funcResult.object as Record<string, unknown>;
    }

    if (isTool(func)) {
        return await runToolCall(ctx, closure, frame, 1, expr, func);
    }

    if (expr.args?.[0]?.type === 'arrowfn') {
        switch (func) {
            case Array.prototype.map:
                return await runArrayMap(ctx, frame, 1, expr, obj);

            case Array.prototype.filter:
                return await runArrayFilter(ctx, frame, 1, expr, obj);

            case Array.prototype.some:
                return await runArraySome(ctx, frame, 1, expr, obj);

            case Array.prototype.every:
                return await runArrayEvery(ctx, frame, 1, expr, obj);
        }
    }

    if (typeof func === 'function') {
        return await runFunctionNative(ctx, closure, frame, 1, expr, func, obj);
    }

    throw new RuntimeError(`Expression is not a function`);
}

async function runArrayMap(
    ctx: ExecuteAgentContext,
    frame: StackFrame,
    index: number,
    expr: FunctionCall,
    arr: unknown,
) {
    const mapResult: unknown[] = [];
    const arrResult = await runArrayFunc(ctx, frame, index, expr, arr, 'map', value => {
        mapResult.push(value);
    });

    if (arrResult.status !== 'done') {
        return updateFrame(frame, arrResult.status);
    }

    frame.value = mapResult;
    return updateFrame(frame, 'done');
}

async function runArrayFilter(
    ctx: ExecuteAgentContext,
    frame: StackFrame,
    index: number,
    expr: FunctionCall,
    arr: unknown,
) {
    const filterResult: unknown[] = [];
    const arrResult = await runArrayFunc(ctx, frame, index, expr, arr, 'filter', (value, item) => {
        if (value) {
            filterResult.push(item);
        }
    });

    if (arrResult.status !== 'done') {
        return updateFrame(frame, arrResult.status);
    }

    frame.value = filterResult;
    return updateFrame(frame, 'done');
}

async function runArraySome(
    ctx: ExecuteAgentContext,
    frame: StackFrame,
    index: number,
    expr: FunctionCall,
    arr: unknown,
) {
    let result = false;

    const arrResult = await runArrayFunc(ctx, frame, index, expr, arr, 'some', value => {
        if (value) {
            result = true;
            return false;
        }
    });

    if (arrResult.status !== 'done') {
        return updateFrame(frame, arrResult.status);
    }

    frame.value = result;
    return updateFrame(frame, 'done');
}

async function runArrayEvery(
    ctx: ExecuteAgentContext,
    frame: StackFrame,
    index: number,
    expr: FunctionCall,
    arr: unknown,
) {
    let result = true;

    const arrResult = await runArrayFunc(ctx, frame, index, expr, arr, 'every', value => {
        if (!value) {
            result = false;
            return false;
        }
    });

    if (arrResult.status !== 'done') {
        return updateFrame(frame, arrResult.status);
    }

    frame.value = result;
    return updateFrame(frame, 'done');
}

async function runArrayFunc(
    ctx: ExecuteAgentContext,
    frame: StackFrame,
    index: number,
    expr: FunctionCall,
    arr: unknown,
    funcName: string,
    func: (value: unknown, item: unknown, index: number) => void | false,
) {
    if (!Array.isArray(arr)) {
        throw new RuntimeError(`Array.prototype.${funcName} called on non-array`);
    }

    const fn = expr.args?.[0];
    if (expr.args?.length !== 1 || fn?.type !== 'arrowfn') {
        throw new RuntimeError(`Array.prototype.${funcName} called with invalid arguments`);
    }

    const itemVar = fn.params[0]?.name;
    const indexVar = fn.params[1]?.name;

    for (let i = 0; i < arr.length; i++) {
        const item = arr[i] as unknown;
        const itemFrame = getFrame(frame, index, fn.body);

        if (!itemFrame.variables) {
            itemFrame.variables = {};

            if (itemVar) {
                itemFrame.variables[itemVar] = item;
            }

            if (indexVar) {
                itemFrame.variables[indexVar] = i;
            }
        }

        const itemResult = await runNode(ctx, itemFrame, frame, index++, fn.body);
        if (itemResult.status !== 'done') {
            return updateFrame(frame, itemResult.status);
        }

        const value = func(itemFrame.value, item, i);
        if (value === false) {
            break;
        }
    }

    return updateFrame(frame, 'done');
}

async function runToolCall(
    ctx: ExecuteAgentContext,
    closure: StackFrame,
    frame: StackFrame,
    index: number,
    expr: FunctionCall,
    tool: ToolDefinition,
): Promise<StackFrameResult> {
    const args = await runExpressionArray(ctx, closure, frame, index, expr.args ?? []);

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
                    const argName = argProps[i]![0];

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

    // Resolve tool dependencies
    let deps: Record<string, unknown>;
    if (tool.deps) {
        assert(ctx.container, 'Container is required to resolve tool dependencies');
        deps = resolveDeps(tool.deps, ctx.container);
    } else {
        deps = {};
    }

    const events = frame.events?.filter(e => !e.processed) || [];
    let result: unknown = tool.handler({
        input,
        state,
        events,
        trace: frame.trace,
        agent: ctx.agent,
        result: toolResultHelper,
        deps,
    });

    if (result instanceof Promise) {
        result = await result;
        ctx.controller.tick();
    }

    if (result === TOOL_AWAIT_RESULT) {
        return updateFrame(frame, 'awaiting');
    }

    frame.value = result;
    return updateFrame(frame, 'done');
}

async function runFunctionNative(
    ctx: ExecuteAgentContext,
    closure: StackFrame,
    frame: StackFrame,
    index: number,
    call: FunctionCall,
    func: NativeFunction,
    thisArg: unknown,
) {
    const allowed = ALLOWED_FUNCTIONS.has(func) || ALLOWED_FUNCTIONS.has(func.name);
    if (!allowed) {
        throw new RuntimeError(`Function ${func.name} is not allowed`);
    }

    const args = await runExpressionArray(ctx, closure, frame, index, call.args ?? []);
    if (!Array.isArray(args)) {
        return updateFrame(frame, args);
    }

    let result = func.apply(thisArg, args) as unknown;
    while (result instanceof Promise) {
        result = await result;
        ctx.controller.tick();
    }

    if (!isSafeValue(result)) {
        throw new RuntimeError(`Function ${func.name} returned unsafe value`);
    }

    frame.value = result;
    return updateFrame(frame, 'done');
}

async function runBinaryExpression(
    ctx: ExecuteAgentContext,
    closure: StackFrame,
    parent: StackFrame,
    index: number,
    expr: BinaryExpression,
) {
    const frame = getFrame(parent, index, expr);

    const leftResult = await runExpression(ctx, closure, frame, 0, expr.left);
    if (leftResult.status !== 'done') {
        return updateFrame(frame, leftResult.status);
    }

    const rightResult = await runExpression(ctx, closure, frame, 1, expr.right);
    if (rightResult.status !== 'done') {
        return updateFrame(frame, rightResult.status);
    }

    const leftValue = leftResult?.value;
    const rightValue = rightResult?.value;

    switch (expr.operator) {
        case '+':
            frame.value = (leftValue as number) + (rightValue as number);
            break;

        case '-':
            frame.value = (leftValue as number) - (rightValue as number);
            break;

        case '*':
            frame.value = (leftValue as number) * (rightValue as number);
            break;

        case '/':
            frame.value = (leftValue as number) / (rightValue as number);
            break;

        case '%':
            frame.value = (leftValue as number) % (rightValue as number);
            break;

        case '==':
            frame.value = leftValue == rightValue;
            break;

        case '===':
            frame.value = leftValue === rightValue;
            break;

        case '!=':
            frame.value = leftValue != rightValue;
            break;

        case '!==':
            frame.value = leftValue !== rightValue;
            break;

        case '>':
            frame.value = (leftValue as number) > (rightValue as number);
            break;

        case '>=':
            frame.value = (leftValue as number) >= (rightValue as number);
            break;

        case '<':
            frame.value = (leftValue as number) < (rightValue as number);
            break;

        case '<=':
            frame.value = (leftValue as number) <= (rightValue as number);
            break;

        default:
            throw new RuntimeError(`Unsupported operator: ${expr.operator as string}`);
    }

    return updateFrame(frame, 'done');
}

async function runLogicalExpression(
    ctx: ExecuteAgentContext,
    closure: StackFrame,
    parent: StackFrame,
    index: number,
    expr: LogicalExpression,
) {
    const frame = getFrame(parent, index, expr);

    const leftResult = await runExpression(ctx, closure, frame, 0, expr.left);
    if (!isDone(leftResult)) {
        return updateFrame(frame, leftResult.status);
    }

    const leftValue = leftResult.value;

    switch (expr.operator) {
        case '&&':
            if (!leftValue) {
                frame.value = leftValue;
                return updateFrame(frame, 'done');
            }

            break;

        case '||':
            if (leftValue) {
                frame.value = leftValue;
                return updateFrame(frame, 'done');
            }

            break;

        case '??':
            if (leftValue != null) {
                frame.value = leftValue;
                return updateFrame(frame, 'done');
            }

            break;

        default:
            throw new RuntimeError(`Unsupported operator: ${expr.operator as string}`);
    }

    const rightResult = await runExpression(ctx, closure, frame, 1, expr.right);
    if (!isDone(rightResult)) {
        return updateFrame(frame, rightResult.status);
    }

    frame.value = rightResult.value;
    return updateFrame(frame, 'done');
}

async function runUnaryExpression(
    ctx: ExecuteAgentContext,
    closure: StackFrame,
    parent: StackFrame,
    index: number,
    expr: UnaryExpression,
) {
    const frame = getFrame(parent, index, expr);
    const exprResult = await runExpression(ctx, closure, frame, 0, expr.expr);
    if (!isDone(exprResult)) {
        return updateFrame(frame, exprResult.status);
    }

    const value = exprResult.value;

    switch (expr.operator) {
        case '-':
            frame.value = -(value as number);
            break;

        case '+':
            frame.value = +(value as number);
            break;

        case 'typeof':
            frame.value = typeof value;
            break;

        case '!':
            frame.value = !(value as boolean);
            break;

        default:
            throw new RuntimeError(`Unsupported unary operator: ${expr.operator as string}`);
    }

    return updateFrame(frame, 'done');
}

async function runUpdateExpression(
    ctx: ExecuteAgentContext,
    closure: StackFrame,
    parent: StackFrame,
    index: number,
    expr: UpdateExpression,
) {
    const frame = getFrame(parent, index, expr);
    if (isDone(frame)) {
        return frame;
    }

    const exprResult = await runExpression(ctx, closure, frame, 0, expr.expr);
    if (exprResult.status !== 'done') {
        return updateFrame(frame, exprResult.status);
    }

    const diff = expr.operator === '++' ? 1 : -1;

    if (expr.pre) {
        frame.value = (exprResult.value as number) + diff;
    } else {
        frame.value = exprResult.value;
    }

    if (expr.expr.type === 'ident') {
        setVariable(frame, expr.expr.name, (exprResult.value as number) + diff);
    }

    return updateFrame(frame, 'done');
}

async function runTernaryExpression(
    ctx: ExecuteAgentContext,
    closure: StackFrame,
    parent: StackFrame,
    index: number,
    expr: TernaryExpression,
) {
    const frame = getFrame(parent, index, expr);

    const conditionResult = await runExpression(ctx, closure, frame, 0, expr.if);

    if (conditionResult.status !== 'done') {
        return updateFrame(frame, conditionResult.status);
    }

    const thenExpression = conditionResult.value ? expr.then : expr.else;
    const thenResult = await runExpression(ctx, closure, frame, 1, thenExpression);

    if (thenResult.status !== 'done') {
        return updateFrame(frame, thenResult.status);
    }

    frame.value = thenResult.value;
    return updateFrame(frame, 'done');
}

async function runNewExpression(
    ctx: ExecuteAgentContext,
    closure: StackFrame,
    parent: StackFrame,
    index: number,
    expr: NewExpression,
) {
    const frame = getFrame(parent, index, expr);

    const constructor = resolveExpression(ctx.agent, frame, expr.func) as Constructor;
    if (typeof constructor !== 'function') {
        throw new RuntimeError(`Expression is not a function`);
    }

    if (!ALLOWED_FUNCTIONS.has(constructor)) {
        throw new RuntimeError(`Constructor ${constructor.name} is not allowed`);
    }

    const args = await runExpressionArray(ctx, closure, frame, 0, expr.args ?? []);

    if (Array.isArray(args)) {
        frame.value = new constructor(...args);
        return updateFrame(frame, 'done');
    }

    return updateFrame(frame, args);
}

async function runTemplateLiteral(
    ctx: ExecuteAgentContext,
    closure: StackFrame,
    parent: StackFrame,
    index: number,
    expr: TemplateLiteral,
) {
    const frame = getFrame(parent, index, expr);

    let result = '';
    let frameIndex = 0;

    for (const part of expr.parts) {
        if (typeof part === 'string') {
            result += part;
        } else {
            const partResult = await runExpression(ctx, closure, frame, frameIndex++, part);

            if (partResult.status !== 'done') {
                return updateFrame(frame, partResult.status);
            }

            result += String(partResult.value);
        }
    }

    frame.value = result;
    return updateFrame(frame, 'done');
}

function runRegexExpression(parent: StackFrame, index: number, expr: RegexExpression) {
    const frame = getFrame(parent, index, expr);
    if (isDone(frame)) {
        return frame;
    }

    const regex = new RegExp(expr.value, expr.flags);
    frame.value = regex;
    return updateFrame(frame, 'done');
}

async function runExpressionArray(
    ctx: ExecuteAgentContext,
    closure: StackFrame,
    frame: StackFrame,
    index: number,
    items: (Expression | SpreadExpression)[],
): Promise<unknown[] | StackFrameStatus> {
    const result: unknown[] = [];

    // todo: run in parallel
    for (const item of items) {
        if (item.type === 'spread') {
            const spreadResult = await runExpression(ctx, closure, frame, index++, item.value);
            if (!isDone(spreadResult)) {
                return spreadResult.status;
            }

            result.push(...(spreadResult.value as unknown[]));
        } else {
            const itemResult = await runExpression(ctx, closure, frame, index++, item);
            if (!isDone(itemResult)) {
                return itemResult.status;
            }

            result.push(itemResult.value);
        }

        if (!ctx.controller.continue()) {
            return 'running';
        }
    }

    return result;
}

async function runReturnStatement(
    ctx: ExecuteAgentContext,
    closure: StackFrame,
    parent: StackFrame,
    index: number,
    node: ReturnStatement,
) {
    const frame = getFrame(parent, index, node);

    let value: unknown;
    if (node.value) {
        const result = await runExpression(ctx, closure, frame, 0, node.value);
        if (result.status !== 'done') {
            return updateFrame(frame, result.status);
        }

        value = result.value;
    }

    while (parent) {
        updateFrame(parent, 'done');

        if (!parent.parent || parent === closure) {
            break;
        }

        parent = parent.parent;
    }

    closure.value = value;
    return updateFrame(frame, 'done');
}

function getFrame(parent: StackFrame, index: number, node: AstNode) {
    let children = parent.children;

    if (!children) {
        parent.children = children = [];
    }

    while (index >= children.length) {
        children.push(null);
    }

    if (children[index]) {
        const frame = children[index];
        frame.node = node;

        return frame;
    }

    const startedAt = new Date();

    const frame: StackFrame = {
        startedAt,
        updatedAt: startedAt,
        parent,
        trace: `${parent.trace}:${index}`,
        status: 'running',
        node,
    };

    children[index] = frame;

    return frame;
}

function updateFrame(frame: StackFrame, status: StackFrameStatus) {
    frame.updatedAt = new Date();
    frame.status = status;

    return frame;
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

function isSafeValue(value: unknown) {
    return typeof value !== 'function';
}

function isDone(frame: StackFrame | StackFrameResult) {
    return frame.status === 'done';
}
