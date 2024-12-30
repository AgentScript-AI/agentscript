import { assertValue } from '@nzyme/utils';

import type { Runtime } from './createRuntime.js';
import type { StackFrame } from './stackTypes.js';
import { isFunction } from '../defineFunction.js';
import type { RuntimeController, RuntimeControllerOptions } from './runtimeController.js';
import { createRuntimeControler } from './runtimeController.js';
import type {
    Expression,
    FunctionCall,
    Literal,
    Node,
    Statement,
    Variable,
} from '../script/astTypes.js';
import { validate } from '@agentscript/schema';

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
        const frameDone = await runFrame(runtime, controller, frame, statement);

        if (frame.completedAt) {
            index++;
            continue;
        }

        return frameDone;
    } while (controller.continue());

    return false;
}

async function runFrame(
    runtime: Runtime,
    controller: RuntimeController,
    frame: StackFrame,
    node: Node,
) {
    const parent = assertValue(frame.parent, 'Stack frame has no parent');

    switch (node.type) {
        case 'VariableDeclaration': {
            if (!node.value) {
                completeFrame(frame);
                return true;
            }

            const valueFrame = getFrame(frame, 0);
            const done = await runExpression(runtime, controller, valueFrame, node.value);
            if (!done) {
                return false;
            }

            setVariable(parent, node.name, valueFrame.result);
            return completeFrame(frame);
        }

        case 'ExpressionStatement': {
            return await runExpression(runtime, controller, frame, node.expression);
        }

        default:
            throw new Error(`Unknown node type: ${node.type}`);
    }
}

async function runExpression(
    runtime: Runtime,
    controller: RuntimeController,
    frame: StackFrame,
    expression: Expression,
) {
    if (frame.completedAt) {
        return true;
    }

    switch (expression.type) {
        case 'Literal': {
            const result = resolveLiteral(expression);
            frame.result = result;
            return completeFrame(frame);
        }

        case 'Variable': {
            const result = resolveVariable(frame, expression);
            frame.result = result;
            return completeFrame(frame);
        }

        case 'FunctionCall': {
            return await runFunctionCall(runtime, controller, frame, expression);
        }

        default:
            throw new Error(`Unknown expression type: ${expression.type}`);
    }
}

async function runFunctionCall(
    runtime: Runtime,
    controller: RuntimeController,
    frame: StackFrame,
    expression: FunctionCall,
) {
    const func = runtime.module[expression.name];
    if (!func) {
        throw new Error(`Function ${expression.name} not found`);
    }

    if (!isFunction(func)) {
        throw new Error(`Function ${expression.name} is not a function`);
    }

    const args: Record<string, unknown> = {};
    const argProps = func.args ? Object.entries(func.args.props) : [];

    // todo: run in parallel
    for (let i = 0; i < expression.arguments.length; i++) {
        const arg = expression.arguments[i];
        const argName = argProps[i][0];
        const argFrame = getFrame(frame, i);
        const done = await runExpression(runtime, controller, argFrame, arg);
        if (!done) {
            return false;
        }

        args[argName] = argFrame.result;

        if (!controller.continue()) {
            return false;
        }
    }

    validate(func.args, args);

    frame.result = await func.handler({ args });
    controller.tick();

    return completeFrame(frame);
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

    throw new Error(`Frame index out of bounds: ${index}`);
}

function completeFrame(frame: StackFrame) {
    frame.completedAt = Date.now();
    return true;
}

function setVariable(frame: StackFrame, name: string, value: unknown) {
    if (!frame.variables) {
        frame.variables = {};
    }

    frame.variables[name] = value;
}

function resolveLiteral(expression: Literal) {
    const value = expression.value;
    if (typeof value === 'object') {
        return JSON.parse(JSON.stringify(value)) as unknown;
    }

    return value;
}

function resolveVariable(frame: StackFrame, expression: Variable) {
    do {
        const variables = frame.variables;
        const name = expression.name;
        if (variables && name in variables) {
            return variables[name];
        }

        if (!frame.parent) {
            throw new Error(`Variable ${name} not found`);
        }

        frame = frame.parent;
    } while (frame);
}
