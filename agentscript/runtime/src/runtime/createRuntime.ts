import type { StackFrame } from './stackTypes.js';
import type { Module } from '../modules/renderModule.js';
import type { Script } from '../script/astTypes.js';

export type RuntimeOptions = {
    module: Module;
    script: Script;
    stack?: StackFrame;
};

export type Runtime = ReturnType<typeof createRuntime>;

export function createRuntime(options: RuntimeOptions) {
    const stack: StackFrame = options.stack ?? {
        startedAt: Date.now(),
    };

    return {
        module: options.module,
        script: options.script,
        stack,
    };
}
