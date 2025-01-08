import type { StackFrame } from './runtimeTypes.js';
import type { AgentDefinition, AgentOutput, RuntimeModule } from '../defineAgent.js';
import type { Script } from '../parser/astTypes.js';

/**
 * Parameters for {@link createAgent}.
 */
export type CreateAgentParams<TAgent extends AgentDefinition> = {
    /**
     * AgentScript script to execute.
     */
    script: Script;
    /**
     * Plan for the agent.
     */
    plan?: string;
    /**
     * State of the agent.
     */
    state?: AgentState<TAgent>;
};

/**
 * Agent to be executed.
 */
export type Agent<TAgent extends AgentDefinition = AgentDefinition> = {
    /**
     * Tools available to the agent.
     */
    tools: RuntimeModule;
    /**
     * Schema for the input of the agent.
     */
    input: TAgent['input'];
    /**
     * Schema for the output of the agent.
     */
    output: TAgent['output'];
    /**
     * AgentScript script to execute.
     */
    script: Script;
    /**
     * Plan for the agent.
     */
    plan?: string;
    /**
     * State of the agent.
     */
    state?: AgentState<TAgent>;
};

type AgentStateBase = {
    /**
     * Root frame of the agent execution stack.
     * Execution progress is stored here.
     */
    root: StackFrame;
};

type AgentStateComplete<TAgent extends AgentDefinition> = {
    /**
     * Whether the agent is complete.
     */
    complete: true;

    /**
     * Output of the agent.
     */
    output: AgentOutput<TAgent>;
};

type AgentStateIncomplete = {
    /**
     * Whether the agent is complete.
     */
    complete: false;

    /**
     * Output of the agent.
     */
    output?: undefined;
};

/**
 * State of the agent.
 */
export type AgentState<TAgent extends AgentDefinition> = AgentStateBase &
    (AgentStateComplete<TAgent> | AgentStateIncomplete);

/**
 * Create a new agent.
 * @param agent - Agent options.
 * @returns New agent.
 */
export function createAgent<TAgent extends AgentDefinition>(
    agent: TAgent & CreateAgentParams<TAgent>,
) {
    return agent as Agent<TAgent>;
}
