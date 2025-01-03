import type { Constructor } from '@nzyme/types';

import { validateOrThrow } from '@agentscript-ai/schema';

import { RuntimeError } from './RuntimeError.js';
import type { Workflow } from './createWorkflow.js';
import type { StackFrame } from './runtimeTypes.js';
import type { ToolDefinition } from '../defineTool.js';
import { isTool } from '../defineTool.js';
import type { NativeFunction } from './common.js';
import { allowedNativeFunctions, allowedNativeIdentifiers } from './common.js';
import type { RuntimeController, RuntimeControllerOptions } from './runtimeController.js';
import { createRuntimeControler } from './runtimeController.js';
import type { Runtime, RuntimeInput, RuntimeOutput } from '../defineRuntime.js';
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

type ExecuteWorkflowInputOptions<TRuntime extends Runtime> =
    RuntimeInput<TRuntime> extends undefined
        ? {
              /** Input for the workflow. */
              input?: undefined;
          }
        : {
              /** Input for the workflow. */
              input: RuntimeInput<TRuntime>;
          };

/**
 * Options for the {@link executeWorkflow} function.
 */
export type ExecuteWorkflowOptions<TRuntime extends Runtime> = {
    /**
     * Workflow to execute.
     */
    workflow: Workflow<TRuntime>;
} & ExecuteWorkflowInputOptions<TRuntime> &
    RuntimeControllerOptions;

/**
 * Result of the {@link executeWorkflow} function.
 */
export interface ExecuteWorkflowResult {
    /**
     * Number of ticks executed.
     * A tick is a single async execution in the workflow.
     */
    ticks: number;
    /**
     * Whether the workflow is done for now.
     * If it is `false`, the workflow is not done and the caller should call {@link executeWorkflow} again.
     */
    done: boolean;
}

/**
 * Execute a workflow.
 * @param options - Options for the workflow.
 * @returns Result of the workflow execution.
 */
export async function executeWorkflow<TRuntime extends Runtime>(
    options: ExecuteWorkflowOptions<TRuntime>,
): Promise<ExecuteWorkflowResult> {
    const { workflow } = options;

    const controller = createRuntimeControler(options);
    if (!workflow.state) {
        workflow.state = {
            complete: false,
            root: { startedAt: Date.now() },
        };

        if (workflow.runtime.output) {
            workflow.state.root.variables = {
                result: undefined,
            };
        }
    }

    const root = workflow.state.root;
    const script = workflow.script.ast;

    if (root.completedAt) {
        return { ticks: controller.ticks, done: true };
    }

    const result = await runBlock(workflow, controller, root, script);

    const frames = root.children;
    if (frames?.length === script.length && frames[frames.length - 1].completedAt) {
        completeFrame(root);
        workflow.state.complete = true;

        if (workflow.runtime.output) {
            const result = root.variables?.result;
            validateOrThrow(workflow.runtime.output, result);
            workflow.state.output = result as RuntimeOutput<TRuntime>;
        }

        return { ticks: controller.ticks, done: true };
    }

    return { ticks: controller.ticks, done: result };
}

async function runBlock(
    runtime: Workflow,
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
        const frameDone = await runBlockFrame(runtime, controller, block, frame, statement);

        if (frame.completedAt) {
            index++;
            continue;
        }

        return frameDone;
    } while (controller.continue());

    return false;
}

async function runBlockFrame(
    runtime: Workflow,
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
            const done = await runExpression(
                runtime,
                controller,
                block,
                valueFrame,
                statement.value,
            );
            if (!done) {
                return false;
            }

            block.variables[name] = valueFrame.value;
            return completeFrame(frame);
        }

        case 'Expression': {
            return await runExpression(runtime, controller, block, frame, statement.expr);
        }

        default:
            throw new RuntimeError(`Unknown statement type: ${(statement as Statement).type}`);
    }
}

async function runExpression(
    runtime: Workflow,
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
            frame.value = resolveIdentifier(runtime, frame, expression);
            return completeFrame(frame);
        }

        case 'Literal': {
            frame.value = resolveLiteral(expression);
            return completeFrame(frame);
        }

        case 'Member': {
            return await runMemberExpression(runtime, controller, block, frame, expression);
        }

        case 'Object': {
            return await runObjectExpression(runtime, controller, block, frame, expression);
        }

        case 'Array': {
            return await runArrayExpression(runtime, controller, block, frame, expression);
        }

        case 'Assignment': {
            const rightFrame = getFrame(frame, 0);

            const result = await runExpression(
                runtime,
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
            return await runFunctionCall(runtime, controller, block, frame, expression);
        }

        case 'New': {
            return await runNewExpression(runtime, controller, block, frame, expression);
        }

        default:
            throw new RuntimeError(
                `Unsupported expression type: ${(expression as Expression).type}`,
            );
    }
}

async function runMemberExpression(
    runtime: Workflow,
    controller: RuntimeController,
    block: StackFrame,
    frame: StackFrame,
    expression: MemberExpression,
) {
    const objectFrame = getFrame(frame, 0);
    const objectDone = await runExpression(runtime, controller, block, objectFrame, expression.obj);
    if (!objectDone) {
        return false;
    }

    let property: string;
    if (expression.prop.type === 'Identifier') {
        property = expression.prop.name;
    } else {
        const propertyFrame = getFrame(frame, 1);
        const propertyDone = await runExpression(
            runtime,
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
    runtime: Workflow,
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
            const keyDone = await runExpression(runtime, controller, block, keyFrame, prop.key);
            if (!keyDone) {
                return false;
            }

            key = keyFrame.value as string;
            index++;
        }

        const valueFrame = getFrame(frame, index);
        const valueDone = await runExpression(runtime, controller, block, valueFrame, prop.value);
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
    runtime: Workflow,
    controller: RuntimeController,
    block: StackFrame,
    frame: StackFrame,
    expression: ArrayExpression,
) {
    const result = await runExpressionArray(runtime, controller, block, frame, expression.items);
    if (!result) {
        return false;
    }

    frame.value = result;

    return completeFrame(frame);
}

async function runFunctionCall(
    runtime: Workflow,
    controller: RuntimeController,
    block: StackFrame,
    frame: StackFrame,
    expression: FunctionCall,
) {
    let func: unknown;
    let obj: unknown;

    if (expression.func.type === 'Member') {
        obj = resolveExpression(runtime, frame, expression.func.obj);
        const prop = resolveName(runtime, frame, expression.func.prop);
        func = (obj as Record<string, unknown>)[prop];
    } else {
        func = resolveExpression(runtime, frame, expression.func);
        obj = undefined;
    }

    if (isTool(func)) {
        return await runFunctionCustom(runtime, controller, block, frame, expression, func);
    }

    if (typeof func === 'function') {
        return await runFunctionNative(runtime, controller, block, frame, expression, func, obj);
    }

    throw new RuntimeError(`Expression is not a function`);
}

async function runFunctionCustom(
    runtime: Workflow,
    controller: RuntimeController,
    block: StackFrame,
    frame: StackFrame,
    call: FunctionCall,
    func: ToolDefinition,
) {
    const args = await runExpressionArray(runtime, controller, block, frame, call.args);
    if (!args) {
        return false;
    }

    let argObject: Record<string, unknown>;

    if (func.singleArg) {
        argObject = args[0] as Record<string, unknown>;
    } else {
        argObject = {};
        const argProps = Object.entries(func.input.props);

        for (let i = 0; i < argProps.length; i++) {
            const arg = args[i];
            const argName = argProps[i][0];

            argObject[argName] = arg;
        }
    }

    validateOrThrow(func.input, argObject);

    const result: unknown = func.handler({ input: argObject });
    if (result instanceof Promise) {
        frame.value = await result;
        controller.tick();
    } else {
        frame.value = result;
    }

    return completeFrame(frame);
}

async function runFunctionNative(
    runtime: Workflow,
    controller: RuntimeController,
    block: StackFrame,
    frame: StackFrame,
    call: FunctionCall,
    func: NativeFunction,
    thisArg: unknown,
) {
    const args = await runExpressionArray(runtime, controller, block, frame, call.args);
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
    runtime: Workflow,
    controller: RuntimeController,
    block: StackFrame,
    frame: StackFrame,
    expression: NewExpression,
) {
    const constructor = resolveExpression(runtime, frame, expression.func) as Constructor;
    if (typeof constructor !== 'function') {
        throw new RuntimeError(`Expression is not a function`);
    }

    if (!allowedNativeFunctions.has(constructor)) {
        throw new RuntimeError(`Constructor ${constructor.name} is not allowed`);
    }

    const args = await runExpressionArray(runtime, controller, block, frame, expression.args);
    if (!args) {
        return false;
    }

    frame.value = new constructor(...args);
    return completeFrame(frame);
}

async function runExpressionArray(
    runtime: Workflow,
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
        const done = await runExpression(runtime, controller, block, argFrame, arg);
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

function resolveExpression(runtime: Workflow, frame: StackFrame, expression: Expression): unknown {
    switch (expression.type) {
        case 'Identifier': {
            return resolveIdentifier(runtime, frame, expression);
        }

        case 'Literal': {
            return resolveLiteral(expression);
        }

        case 'Member': {
            const object = resolveExpression(runtime, frame, expression.obj);
            const property = resolveName(runtime, frame, expression.prop);

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

function resolveName(runtime: Workflow, frame: StackFrame, expression: Expression) {
    if (expression.type === 'Identifier') {
        return expression.name;
    }

    return resolveExpression(runtime, frame, expression) as string;
}

function resolveIdentifier(workflow: Workflow, frame: StackFrame, expression: Identifier) {
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

    const tools = workflow.runtime.tools;
    if (name in tools) {
        return tools[name];
    }

    if (allowedNativeIdentifiers.has(name)) {
        return (globalThis as Record<string, unknown>)[name];
    }

    throw new RuntimeError(`Variable ${expression.name} not found`);
}
