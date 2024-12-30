import { validate } from '@agentscript.ai/schema';

import { RuntimeError } from './RuntimeError.js';
import type { Runtime } from './createRuntime.js';
import type { StackFrame } from './runtimeTypes.js';
import type { FunctionDefinition } from '../defineFunction.js';
import { isFunction } from '../defineFunction.js';
import type { NativeFunction } from './functions.js';
import { allowedNativeFunctions } from './functions.js';
import type { RuntimeController, RuntimeControllerOptions } from './runtimeController.js';
import { createRuntimeControler } from './runtimeController.js';
import type {
    Expression,
    FunctionCall,
    Identifier,
    Literal,
    Node,
    Statement,
} from '../parser/astTypes.js';

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

            block.variables[name] = valueFrame.result;
            return completeFrame(frame);
        }

        case 'Expression': {
            return await runExpression(runtime, controller, block, frame, node.expression);
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
                setVariable(block, expression.left.name, rightFrame.result);
                return completeFrame(frame);
            }

            throw new Error('Assignment left must be a variable');
        }

        case 'FunctionCall': {
            return await runFunctionCall(runtime, controller, block, frame, expression);
        }

        default: {
            const result = resolveExpression(runtime, frame, expression);
            frame.result = result;
            return completeFrame(frame);
        }
    }
}

async function runFunctionCall(
    runtime: Runtime,
    controller: RuntimeController,
    block: StackFrame,
    frame: StackFrame,
    expression: FunctionCall,
) {
    const func = resolveExpression(runtime, frame, expression.func);

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
    const args = await runFunctionArgs(runtime, controller, block, frame, call);
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

    frame.result = await func.handler({ args: argObject });
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
) {
    const args = await runFunctionArgs(runtime, controller, block, frame, call);
    if (!args) {
        return false;
    }

    const allowed = allowedNativeFunctions.has(func) || allowedNativeFunctions.has(func.name);
    if (!allowed) {
        throw new RuntimeError(`Function ${func.name} is not allowed`);
    }

    const result = func(...args);
    if (result instanceof Promise) {
        frame.result = await result;
        controller.tick();
    } else {
        frame.result = result;
    }

    return completeFrame(frame);
}

async function runFunctionArgs(
    runtime: Runtime,
    controller: RuntimeController,
    block: StackFrame,
    frame: StackFrame,
    call: FunctionCall,
) {
    const args: unknown[] = [];

    // todo: run in parallel
    for (let i = 0; i < call.arguments.length; i++) {
        const arg = call.arguments[i];
        const argFrame = getFrame(frame, i);
        const done = await runExpression(runtime, controller, block, argFrame, arg);
        if (!done) {
            return false;
        }

        args.push(argFrame.result);

        if (!controller.continue()) {
            return false;
        }
    }

    return args;
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
            return resolveVariable(runtime, frame, expression);
        }

        case 'Literal': {
            return resolveLiteral(expression);
        }

        case 'Member': {
            const object = resolveExpression(runtime, frame, expression.object);
            const property = resolveName(runtime, frame, expression.property);

            return (object as Record<string, unknown>)[property];
        }

        case 'Object': {
            const result: Record<string, unknown> = {};
            for (const prop of expression.props) {
                const key = resolveName(runtime, frame, prop.key);
                const value = resolveExpression(runtime, frame, prop.value);

                result[key] = value;
            }

            return result;
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

function resolveVariable(runtime: Runtime, frame: StackFrame, expression: Identifier) {
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

    throw new RuntimeError(`Variable ${expression.name} not found`);
}
