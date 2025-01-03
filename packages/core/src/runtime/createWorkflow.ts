import type { StackFrame } from './runtimeTypes.js';
import type { Runtime, RuntimeOutput } from '../defineRuntime.js';
import type { Script } from '../parser/astTypes.js';

/**
 * Workflow to be executed.
 */
export type Workflow<TRuntime extends Runtime = Runtime> = {
    /**
     * AgentScript runtime workflow is running in.
     */
    runtime: TRuntime;
    /**
     * AgentScript script to execute.
     */
    script: Script;
    /**
     * Plan for the workflow.
     */
    plan?: string;
    /**
     * State of the workflow.
     */
    state?: WorkflowState<TRuntime>;
};

type WorkflowStateBase = {
    /**
     * Root frame of the workflow execution stack.
     * Execution progress is stored here.
     */
    root: StackFrame;
};

type WorkflowStateComplete<TRuntime extends Runtime> = {
    /**
     * Whether the workflow is complete.
     */
    complete: true;

    /**
     * Output of the workflow.
     */
    output: RuntimeOutput<TRuntime>;
};

type WorkflowStateIncomplete = {
    /**
     * Whether the workflow is complete.
     */
    complete: false;

    /**
     * Output of the workflow.
     */
    output?: undefined;
};

/**
 * State of the workflow.
 */
export type WorkflowState<TRuntime extends Runtime> = WorkflowStateBase &
    (WorkflowStateComplete<TRuntime> | WorkflowStateIncomplete);

/**
 * Create a new workflow.
 * @param workflow - Workflow options.
 * @returns New workflow.
 */
export function createWorkflow<TRuntime extends Runtime>(
    workflow: Workflow<TRuntime>,
): Workflow<TRuntime> {
    return workflow;
}
