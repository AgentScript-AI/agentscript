import type { StackFrame } from './runtimeTypes.js';
import type { Runtime } from '../defineRuntime.js';
import type { Script } from '../parser/astTypes.js';

/**
 * Options for {@link createWorkflow}.
 */
export type WorkflowOptions<TRuntime extends Runtime> = {
    /**
     * AgentScript runtime to use.
     */
    runtime: TRuntime;
    /**
     * AgentScript script AST to execute.
     */
    ast: Script;
    /**
     * Code for the workflow.
     */
    code?: string;
    /**
     * Plan for the workflow.
     */
    plan?: string;
    /**
     * State of the workflow.
     */
    state?: StackFrame;
};

/**
 *
 */
export type Workflow<TRuntime extends Runtime = Runtime> = {
    /**
     * AgentScript runtime workflow is running in.
     */
    runtime: TRuntime;
    /**
     * AgentScript script AST to execute.
     */
    ast: Script;
    /**
     * Code for the workflow.
     */
    code?: string;
    /**
     * Plan for the workflow.
     */
    plan?: string;
    /**
     * State of the workflow.
     */
    state: StackFrame;
};

/**
 * Create a new workflow.
 * @param options - Workflow options.
 * @returns New workflow.
 */
export function createWorkflow<TRuntime extends Runtime>(
    options: WorkflowOptions<TRuntime>,
): Workflow<TRuntime> {
    const state: StackFrame = options.state ?? {
        startedAt: Date.now(),
    };

    return {
        runtime: options.runtime,
        ast: options.ast,
        code: options.code,
        plan: options.plan,
        state,
    };
}
