import type { Constructor, EmptyObject } from '@nzyme/types';

import type {
    ArrayExpression,
    AssignmentExpression,
    AstNode,
    BreakStatement,
    Expression,
    FunctionCall,
    IdentifierExpression,
    IfStatement,
    MemberExpression,
    NewExpression,
    ObjectExpression,
    OperatorExpression,
    ReturnStatement,
    TemplateLiteral,
    TernaryExpression,
    UpdateExpression,
    VariableDeclaration,
    WhileStatement,
} from '@agentscript-ai/parser';
import * as s from '@agentscript-ai/schema';
import { validateOrThrow } from '@agentscript-ai/schema';

import { RuntimeError } from './RuntimeError.js';
import type { NativeFunction } from './common.js';
import { allowedNativeFunctions } from './common.js';
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
import { ALLOWED_GLOBALS, resolveExpression, resolveLiteral } from './utils/resolveExpression.js';
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
    const result = await runBlockStatement(agent, controller, root, root, script);

    agent.status = result.status;

    if (result.status === 'done' && agent.def.output) {
        const result = root.variables?.result as AgentOutput<TOutput>;
        validateOrThrow(agent.def.output, result);
        agent.output = result;
    }

    return { ticks: controller.ticks };
}

async function runBlockStatement(
    agent: Agent,
    controller: RuntimeController,
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

        if (index >= nodes.length) {
            // went through all statements in block
            return updateFrame(block, 'done');
        }

        if (!controller.continue()) {
            return block;
        }

        frame = block.children[index];
        if (frame?.status === 'done') {
            index++;
            continue;
        }

        const frameResult = await runNode(agent, controller, closure, block, index, nodes[index]);
        if (frameResult.status !== 'done') {
            return updateFrame(block, frameResult.status);
        }

        index++;
    }
}

async function runNode(
    agent: Agent,
    controller: RuntimeController,
    closure: StackFrame,
    parent: StackFrame,
    index: number,
    node: AstNode,
): Promise<StackFrameResult> {
    switch (node.type) {
        case 'var':
            return await runVarStatement(agent, controller, closure, parent, index, node);

        case 'block': {
            const frame = getFrame(parent, index, node);
            return await runBlockStatement(agent, controller, closure, frame, node.body);
        }

        case 'if':
            return await runIfStatement(agent, controller, closure, parent, index, node);

        case 'while':
            return await runWhileStatement(agent, controller, closure, parent, index, node);

        case 'break':
            return runBreakStatement(parent, index, node);

        case 'return':
            return await runReturnStatement(agent, controller, closure, parent, index, node);

        default:
            return await runExpression(agent, controller, closure, parent, index, node);
    }
}

async function runVarStatement(
    agent: Agent,
    controller: RuntimeController,
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

    const valueResult = await runExpression(agent, controller, closure, frame, 0, node.value);
    if (valueResult.status !== 'done') {
        return updateFrame(frame, valueResult.status);
    }

    parent.variables[name] = valueResult.value;
    return updateFrame(frame, 'done');
}

async function runIfStatement(
    agent: Agent,
    controller: RuntimeController,
    closure: StackFrame,
    parent: StackFrame,
    index: number,
    node: IfStatement,
) {
    const frame = getFrame(parent, index, node);
    if (isDone(frame)) {
        return frame;
    }

    const condition = await runExpression(agent, controller, closure, frame, 0, node.if);
    if (condition.status !== 'done') {
        return updateFrame(frame, condition.status);
    }

    const thenNode = condition.value ? node.then : node.else;
    if (thenNode) {
        const thenResult = await runNode(agent, controller, closure, frame, 1, thenNode);
        return updateFrame(frame, thenResult.status);
    }

    return updateFrame(frame, 'done');
}

async function runWhileStatement(
    agent: Agent,
    controller: RuntimeController,
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

        if (!controller.continue()) {
            return frame;
        }

        const ticks = controller.ticks;
        const condition = await runExpression(agent, controller, closure, frame, i++, node.if);
        if (condition.status !== 'done') {
            return updateFrame(frame, condition.status);
        }

        if (!condition.value) {
            return updateFrame(frame, 'done');
        }

        const body = await runNode(agent, controller, closure, frame, i++, node.body);
        if (body.status !== 'done') {
            return updateFrame(frame, body.status);
        }

        if (controller.ticks === ticks) {
            controller.tick();
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
    agent: Agent,
    controller: RuntimeController,
    closure: StackFrame,
    parent: StackFrame,
    index: number,
    expr: Expression,
): Promise<StackFrameResult> {
    switch (expr.type) {
        case 'ident':
            return runIdentifierExpression(agent, parent, index, expr);

        case 'literal':
            return { value: resolveLiteral(expr), status: 'done' };

        case 'member':
            return await runMemberExpression(agent, controller, closure, parent, index, expr);

        case 'operator':
            return await runOperatorExpression(agent, controller, closure, parent, index, expr);

        case 'update':
            return await runUpdateExpression(agent, controller, closure, parent, index, expr);

        case 'ternary':
            return await runTernaryExpression(agent, controller, closure, parent, index, expr);

        case 'object':
            return await runObjectExpression(agent, controller, closure, parent, index, expr);

        case 'array':
            return await runArrayExpression(agent, controller, closure, parent, index, expr);

        case 'assign':
            return await runAssignExpression(agent, controller, closure, parent, index, expr);

        case 'call':
            return await runFunctionCall(agent, controller, closure, parent, index, expr);

        case 'new':
            return await runNewExpression(agent, controller, closure, parent, index, expr);

        case 'template':
            return await runTemplateLiteral(agent, controller, closure, parent, index, expr);

        default:
            throw new RuntimeError(`Unsupported expression type: ${(expr as Expression).type}`);
    }
}

function runIdentifierExpression(
    agent: Agent,
    parent: StackFrame,
    index: number,
    expression: IdentifierExpression,
): StackFrameResult {
    const name = expression.name;

    let variableFrame: StackFrame | undefined = parent;
    while (variableFrame) {
        const variables = variableFrame.variables;
        if (variables && name in variables) {
            const frame = getFrame(parent, index, expression);

            frame.value = variables[name];
            return updateFrame(frame, 'done');
        }

        variableFrame = variableFrame.parent;
    }

    const tools = agent.def.tools;
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

    throw new RuntimeError(`Variable ${expression.name} not found`);
}

async function runMemberExpression(
    agent: Agent,
    controller: RuntimeController,
    closure: StackFrame,
    parent: StackFrame,
    index: number,
    expression: MemberExpression,
): Promise<StackFrameResult> {
    const frame = getFrame(parent, index, expression);
    if (frame.status === 'done' && frame.value !== undefined) {
        return frame;
    }

    const objectResult = await runExpression(agent, controller, closure, frame, 0, expression.obj);
    if (objectResult.status !== 'done') {
        return updateFrame(frame, objectResult.status);
    }

    let property: string;
    let unsafe = objectResult.unsafe;
    if (expression.prop.type === 'ident') {
        property = expression.prop.name;
    } else {
        const propertyResult = await runExpression(
            agent,
            controller,
            closure,
            frame,
            1,
            expression.prop,
        );

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
    agent: Agent,
    controller: RuntimeController,
    closure: StackFrame,
    parent: StackFrame,
    index: number,
    expression: ObjectExpression,
): Promise<StackFrameResult> {
    const frame = getFrame(parent, index, expression);
    const result: Record<string, unknown> = {};

    let propIndex = 0;

    // todo: run in parallel
    for (const prop of expression.props) {
        let key: string;
        if (prop.key.type === 'ident') {
            key = prop.key.name;
        } else {
            const keyResult = await runExpression(
                agent,
                controller,
                closure,
                frame,
                propIndex,
                prop.key,
            );

            if (keyResult.status !== 'done') {
                return updateFrame(frame, keyResult.status);
            }

            key = keyResult.value as string;
        }

        // always increment propIndex for both key and value
        // so that frames are deterministic
        propIndex++;

        const valueResult = await runExpression(
            agent,
            controller,
            closure,
            frame,
            propIndex,
            prop.value,
        );

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
    agent: Agent,
    controller: RuntimeController,
    closure: StackFrame,
    parent: StackFrame,
    index: number,
    expression: ArrayExpression,
) {
    const frame = getFrame(parent, index, expression);
    const result = await runExpressionArray(agent, controller, closure, frame, 0, expression.items);

    if (Array.isArray(result)) {
        frame.value = result;
        return updateFrame(frame, 'done');
    }

    return updateFrame(frame, result);
}

async function runAssignExpression(
    agent: Agent,
    controller: RuntimeController,
    closure: StackFrame,
    parent: StackFrame,
    index: number,
    expr: AssignmentExpression,
): Promise<StackFrameResult> {
    const frame = getFrame(parent, index, expr);
    if (isDone(frame)) {
        return frame;
    }

    if (expr.left.type !== 'ident') {
        throw new Error('Assignment left must be a variable');
    }

    const right = await runExpression(agent, controller, closure, frame, 1, expr.right);
    if (right.status !== 'done') {
        return updateFrame(frame, right.status);
    }

    setVariable(parent, expr.left.name, right.value);
    frame.value = right.value;
    return updateFrame(frame, 'done');
}

async function runFunctionCall(
    agent: Agent,
    controller: RuntimeController,
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
        if (expr.func.prop.type !== 'ident') {
            throw new RuntimeError('Dynamic method calls are not supported');
        }

        const objResult = await runExpression(agent, controller, closure, frame, 0, expr.func.obj);
        if (objResult.status !== 'done') {
            return updateFrame(frame, objResult.status);
        }

        obj = objResult.value as Record<string, unknown>;
        func = obj[expr.func.prop.name];
    } else {
        const funcResult = await runExpression(agent, controller, closure, frame, 0, expr.func);
        if (funcResult.status !== 'done') {
            return updateFrame(frame, funcResult.status);
        }

        func = funcResult.value;
        obj = funcResult.object as Record<string, unknown>;
    }

    if (isTool(func)) {
        return await runToolCall(agent, controller, closure, frame, 1, expr, func);
    }

    switch (func) {
        case Array.prototype.map:
            return await runArrayMap(agent, controller, frame, 1, expr, obj);

        case Array.prototype.filter:
            return await runArrayFilter(agent, controller, frame, 1, expr, obj);

        case Array.prototype.some:
            return await runArraySome(agent, controller, frame, 1, expr, obj);

        case Array.prototype.every:
            return await runArrayEvery(agent, controller, frame, 1, expr, obj);
    }

    if (typeof func === 'function') {
        return await runFunctionNative(agent, controller, closure, frame, 1, expr, func, obj);
    }

    throw new RuntimeError(`Expression is not a function`);
}

async function runArrayMap(
    agent: Agent,
    controller: RuntimeController,
    frame: StackFrame,
    index: number,
    expr: FunctionCall,
    arr: unknown,
) {
    const mapResult: unknown[] = [];
    const arrResult = await runArrayFunc(
        agent,
        controller,
        frame,
        index,
        expr,
        arr,
        'map',
        value => {
            mapResult.push(value);
        },
    );

    if (arrResult.status !== 'done') {
        return updateFrame(frame, arrResult.status);
    }

    frame.value = mapResult;
    return updateFrame(frame, 'done');
}

async function runArrayFilter(
    agent: Agent,
    controller: RuntimeController,
    frame: StackFrame,
    index: number,
    expr: FunctionCall,
    arr: unknown,
) {
    const filterResult: unknown[] = [];
    const arrResult = await runArrayFunc(
        agent,
        controller,
        frame,
        index,
        expr,
        arr,
        'filter',
        (value, item) => {
            if (value) {
                filterResult.push(item);
            }
        },
    );

    if (arrResult.status !== 'done') {
        return updateFrame(frame, arrResult.status);
    }

    frame.value = filterResult;
    return updateFrame(frame, 'done');
}

async function runArraySome(
    agent: Agent,
    controller: RuntimeController,
    frame: StackFrame,
    index: number,
    expr: FunctionCall,
    arr: unknown,
) {
    let result = false;

    const arrResult = await runArrayFunc(
        agent,
        controller,
        frame,
        index,
        expr,
        arr,
        'some',
        value => {
            if (value) {
                result = true;
                return false;
            }
        },
    );

    if (arrResult.status !== 'done') {
        return updateFrame(frame, arrResult.status);
    }

    frame.value = result;
    return updateFrame(frame, 'done');
}

async function runArrayEvery(
    agent: Agent,
    controller: RuntimeController,
    frame: StackFrame,
    index: number,
    expr: FunctionCall,
    arr: unknown,
) {
    let result = true;

    const arrResult = await runArrayFunc(
        agent,
        controller,
        frame,
        index,
        expr,
        arr,
        'every',
        value => {
            if (!value) {
                result = false;
                return false;
            }
        },
    );

    if (arrResult.status !== 'done') {
        return updateFrame(frame, arrResult.status);
    }

    frame.value = result;
    return updateFrame(frame, 'done');
}

async function runArrayFunc(
    agent: Agent,
    controller: RuntimeController,
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

        const itemResult = await runNode(agent, controller, itemFrame, frame, index++, fn.body);
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
    agent: Agent,
    controller: RuntimeController,
    closure: StackFrame,
    frame: StackFrame,
    index: number,
    expr: FunctionCall,
    tool: ToolDefinition,
): Promise<StackFrameResult> {
    const args = await runExpressionArray(
        agent,
        controller,
        closure,
        frame,
        index,
        expr.args ?? [],
    );

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
    return updateFrame(frame, 'done');
}

async function runFunctionNative(
    agent: Agent,
    controller: RuntimeController,
    closure: StackFrame,
    frame: StackFrame,
    index: number,
    call: FunctionCall,
    func: NativeFunction,
    thisArg: unknown,
) {
    const allowed = allowedNativeFunctions.has(func) || allowedNativeFunctions.has(func.name);
    if (!allowed) {
        throw new RuntimeError(`Function ${func.name} is not allowed`);
    }

    const args = await runExpressionArray(
        agent,
        controller,
        closure,
        frame,
        index,
        call.args ?? [],
    );
    if (!Array.isArray(args)) {
        return updateFrame(frame, args);
    }

    let result = func.apply(thisArg, args) as unknown;
    while (result instanceof Promise) {
        result = await result;
        controller.tick();
    }

    if (!isSafeValue(result)) {
        throw new RuntimeError(`Function ${func.name} returned unsafe value`);
    }

    frame.value = result;
    return updateFrame(frame, 'done');
}

async function runOperatorExpression(
    agent: Agent,
    controller: RuntimeController,
    closure: StackFrame,
    parent: StackFrame,
    index: number,
    expression: OperatorExpression,
) {
    const frame = getFrame(parent, index, expression);

    let leftResult: StackFrameResult | undefined;
    let rightResult: StackFrameResult | undefined;

    if (expression.left) {
        leftResult = await runExpression(agent, controller, closure, frame, 0, expression.left);

        if (leftResult.status !== 'done') {
            return updateFrame(frame, leftResult.status);
        }
    }

    if (expression.right) {
        rightResult = await runExpression(agent, controller, closure, frame, 1, expression.right);

        if (rightResult.status !== 'done') {
            return updateFrame(frame, rightResult.status);
        }
    }

    const leftValue = leftResult?.value;
    const rightValue = rightResult?.value;

    switch (expression.operator) {
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

        case '&&':
            frame.value = (leftValue as boolean) && (rightValue as boolean);
            break;

        case '||':
            frame.value = (leftValue as boolean) || (rightValue as boolean);
            break;

        case '??':
            frame.value = leftValue ?? rightValue;
            break;

        default:
            throw new RuntimeError(`Unsupported operator: ${expression.operator as string}`);
    }

    return updateFrame(frame, 'done');
}

async function runUpdateExpression(
    agent: Agent,
    controller: RuntimeController,
    closure: StackFrame,
    parent: StackFrame,
    index: number,
    expr: UpdateExpression,
) {
    const frame = getFrame(parent, index, expr);
    if (isDone(frame)) {
        return frame;
    }

    const exprResult = await runExpression(agent, controller, closure, frame, 0, expr.expr);
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
    agent: Agent,
    controller: RuntimeController,
    closure: StackFrame,
    parent: StackFrame,
    index: number,
    expression: TernaryExpression,
) {
    const frame = getFrame(parent, index, expression);

    const conditionResult = await runExpression(
        agent,
        controller,
        closure,
        frame,
        0,
        expression.if,
    );

    if (conditionResult.status !== 'done') {
        return updateFrame(frame, conditionResult.status);
    }

    const thenExpression = conditionResult.value ? expression.then : expression.else;
    const thenResult = await runExpression(agent, controller, closure, frame, 1, thenExpression);

    if (thenResult.status !== 'done') {
        return updateFrame(frame, thenResult.status);
    }

    frame.value = thenResult.value;
    return updateFrame(frame, 'done');
}

async function runNewExpression(
    agent: Agent,
    controller: RuntimeController,
    closure: StackFrame,
    parent: StackFrame,
    index: number,
    expression: NewExpression,
) {
    const frame = getFrame(parent, index, expression);

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
        closure,
        frame,
        0,
        expression.args ?? [],
    );

    if (Array.isArray(args)) {
        frame.value = new constructor(...args);
        return updateFrame(frame, 'done');
    }

    return updateFrame(frame, args);
}

async function runTemplateLiteral(
    agent: Agent,
    controller: RuntimeController,
    closure: StackFrame,
    parent: StackFrame,
    index: number,
    expression: TemplateLiteral,
) {
    const frame = getFrame(parent, index, expression);

    let result = '';
    let frameIndex = 0;

    for (const part of expression.parts) {
        if (typeof part === 'string') {
            result += part;
        } else {
            const partResult = await runExpression(
                agent,
                controller,
                closure,
                frame,
                frameIndex++,
                part,
            );

            if (partResult.status !== 'done') {
                return updateFrame(frame, partResult.status);
            }

            result += String(partResult.value);
        }
    }

    frame.value = result;
    return updateFrame(frame, 'done');
}

async function runExpressionArray(
    agent: Agent,
    controller: RuntimeController,
    closure: StackFrame,
    frame: StackFrame,
    index: number,
    items: Expression[],
): Promise<unknown[] | StackFrameStatus> {
    const result: unknown[] = [];

    // todo: run in parallel
    for (const item of items) {
        const itemResult = await runExpression(agent, controller, closure, frame, index++, item);

        if (itemResult.status !== 'done') {
            return itemResult.status;
        }

        result.push(itemResult.value);

        if (!controller.continue()) {
            return 'running';
        }
    }

    return result;
}

async function runReturnStatement(
    agent: Agent,
    controller: RuntimeController,
    closure: StackFrame,
    parent: StackFrame,
    index: number,
    node: ReturnStatement,
) {
    const frame = getFrame(parent, index, node);

    let value: unknown;
    if (node.value) {
        const result = await runExpression(agent, controller, closure, frame, 0, node.value);
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
