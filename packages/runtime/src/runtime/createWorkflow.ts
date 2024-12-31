import type { StackFrame } from './runtimeTypes.js';
import type { Runtime } from '../defineRuntime.js';
import type { Script } from '../parser/astTypes.js';

export type WorkflowOptions<TRuntime extends Runtime> = {
    runtime: TRuntime;
    script: Script;
    stack?: StackFrame;
};

export type Workflow<TRuntime extends Runtime = Runtime> = ReturnType<
    typeof createWorkflow<TRuntime>
>;

export function createWorkflow<TRuntime extends Runtime>(options: WorkflowOptions<TRuntime>) {
    const stack: StackFrame = options.stack ?? {
        startedAt: Date.now(),
    };

    return {
        runtime: options.runtime,
        script: options.script,
        stack,
    };
}
