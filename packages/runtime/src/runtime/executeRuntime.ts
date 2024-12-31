import { validate } from '@agentscript.ai/schema';
import type { Constructor } from '@nzyme/types';

import { RuntimeError } from './RuntimeError.js';
import type { Runtime } from './createRuntime.js';
import type { StackFrame } from './runtimeTypes.js';
import type { FunctionDefinition } from '../defineFunction.js';
import { isFunction } from '../defineFunction.js';
import type { NativeFunction } from './functions.js';
import { allowedNativeConstructors, allowedNativeFunctions } from './functions.js';
import type { RuntimeController, RuntimeControllerOptions } from './runtimeController.js';
import { createRuntimeControler } from './runtimeController.js';
import type {
    ArrayExpression,
    Expression,
    FunctionCall,
    Identifier,
    Literal,
    MemberExpression,
    NewExpression,
    Node,
    ObjectExpression,
    Statement,
} from '../parser/astTypes.js';

const allowedNativeIdentifiers = new Set([
    'Date',
    'Array',
    'Object',
    'String',
    'Number',
    'Boolean',
]);

export interface ExecuteRuntimeOptions extends RuntimeControllerOptions {
    runtime: Runtime;
}

export interface RuntimeResult {
    ticks: number;
    done: boolean;
}

export async function executeRuntime(options: ExecuteRuntimeOptions): Promise<RuntimeResult> {
    const { runtime } = options;
    const controller = createRuntimeControler(options);
    const stack = runtime.stack;
    const script = runtime.script;

    if (stack.completedAt) {
        return { ticks: controller.ticks, done: true };
    }

    const result = await runBlock(runtime, controller, stack, script);

    const frames = stack.children;
    if (frames?.length === script.length && frames[frames.length - 1].completedAt) {
        completeFrame(stack);
        return { ticks: controller.ticks, done: true };
    }

    return { ticks: controller.ticks, done: result };
}

async function runBlock(
    runtime: Runtime,
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
    runtime: Runtime,
    controller: RuntimeController,
    block: StackFrame,
    frame: StackFrame,
    node: Node,
) {
    switch (node.type) {
        case 'Variable': {
            const name = node.name;

            if (!block.variables) {
                block.variables = {};
            }

            if (name in block.variables) {
                throw new RuntimeError(`Variable ${name} already exists`);
            }

            if (!node.value) {
                block.variables[name] = undefined;
                completeFrame(frame);
                return true;
            }

            const valueFrame = getFrame(frame, 0);
            const done = await runExpression(runtime, controller, block, valueFrame, node.value);
            if (!done) {
                return false;
            }

            block.variables[name] = valueFrame.value;
            return completeFrame(frame);
        }

        case 'Expression': {
            return await runExpression(runtime, controller, block, frame, node.expr);
        }

        default:
            throw new RuntimeError(`Unknown node type: ${node.type}`);
    }
}

async function runExpression(
    runtime: Runtime,
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
    runtime: Runtime,
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
    runtime: Runtime,
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
    runtime: Runtime,
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
    runtime: Runtime,
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

    if (isFunction(func)) {
        return await runFunctionCustom(runtime, controller, block, frame, expression, func);
    }

    if (typeof func === 'function') {
        return await runFunctionNative(
            runtime,
            controller,
            block,
            frame,
            expression,
            func as NativeFunction,
            obj,
        );
    }

    throw new RuntimeError(`Expression is not a function`);
}

async function runFunctionCustom(
    runtime: Runtime,
    controller: RuntimeController,
    block: StackFrame,
    frame: StackFrame,
    call: FunctionCall,
    func: FunctionDefinition,
) {
    const args = await runExpressionArray(runtime, controller, block, frame, call.args);
    if (!args) {
        return false;
    }

    const argProps = func.args ? Object.entries(func.args.props) : [];
    const argObject: Record<string, unknown> = {};

    for (let i = 0; i < argProps.length; i++) {
        const arg = args[i];
        const argName = argProps[i][0];

        argObject[argName] = arg;
    }

    validate(func.args, args);

    frame.value = await func.handler({ args: argObject });
    controller.tick();

    return completeFrame(frame);
}

async function runFunctionNative(
    runtime: Runtime,
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

    const result = func.apply(thisArg, args);
    if (result instanceof Promise) {
        frame.value = await result;
        controller.tick();
    } else {
        frame.value = result;
    }

    return completeFrame(frame);
}

async function runNewExpression(
    runtime: Runtime,
    controller: RuntimeController,
    block: StackFrame,
    frame: StackFrame,
    expression: NewExpression,
) {
    const constructor = resolveExpression(runtime, frame, expression.func) as Constructor;
    if (typeof constructor !== 'function') {
        throw new RuntimeError(`Expression is not a function`);
    }

    if (!allowedNativeConstructors.has(constructor)) {
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
    runtime: Runtime,
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

function resolveExpression(runtime: Runtime, frame: StackFrame, expression: Expression): unknown {
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

function resolveName(runtime: Runtime, frame: StackFrame, expression: Expression) {
    if (expression.type === 'Identifier') {
        return expression.name;
    }

    return resolveExpression(runtime, frame, expression) as string;
}

function resolveIdentifier(runtime: Runtime, frame: StackFrame, expression: Identifier) {
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

    if (name in runtime.module) {
        return runtime.module[name];
    }

    if (allowedNativeIdentifiers.has(name)) {
        return (globalThis as Record<string, unknown>)[name];
    }

    throw new RuntimeError(`Variable ${expression.name} not found`);
}
