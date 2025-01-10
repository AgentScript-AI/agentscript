import { v7 as uuid } from 'uuid';

import type { StackFrame } from './runtimeTypes.js';
import type {
    AgentDefinition,
    AgentInputBase,
    AgentOutput,
    AgentOutputBase,
    AgentTools,
} from '../defineAgent.js';
import type { Script } from '../parser/astTypes.js';

/**
 * Parameters for {@link createAgent}.
 */
export type CreateAgentParams<
    TTools extends AgentTools,
    TInput extends AgentInputBase,
    TOutput extends AgentOutputBase,
> = AgentDefinition<TTools, TInput, TOutput> & {
    /**
     * ID of the agent.
     * If not provided, it will be generated as a UUID.
     */
    readonly id?: string;
    /**
     * AgentScript script to execute.
     */
    readonly script: Script;
    /**
     * Plan for the agent.
     */
    readonly plan?: string;
    /**
     * State of the agent.
     */
    readonly state?: AgentState<TOutput>;
};

/**
 * Agent to be executed.
 */
export type Agent<
    TTools extends AgentTools = AgentTools,
    TInput extends AgentInputBase = AgentInputBase,
    TOutput extends AgentOutputBase = AgentOutputBase,
> = AgentDefinition<TTools, TInput, TOutput> & {
    /**
     * ID of the agent.
     */
    id: string;
    /**
     * Tools available to the agent.
     */
    tools: TTools;
    /**
     * Schema for the input of the agent.
     */
    input: TInput;
    /**
     * Schema for the output of the agent.
     */
    output: TOutput;
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
    state?: AgentState<TOutput>;
};

type AgentStateBase = {
    /**
     * Root frame of the agent execution stack.
     * Execution progress is stored here.
     */
    root: StackFrame;
};

type AgentStateComplete<TOutput extends AgentOutputBase> = {
    /**
     * Whether the agent is complete.
     */
    complete: true;

    /**
     * Output of the agent.
     */
    output: AgentOutput<TOutput>;
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
export type AgentState<TOutput extends AgentOutputBase> = AgentStateBase &
    (AgentStateComplete<TOutput> | AgentStateIncomplete);

/**
 * Create a new agent.
 * @param agent - Agent options.
 * @returns New agent.
 */
export function createAgent<
    TTools extends AgentTools,
    TInput extends AgentInputBase,
    TOutput extends AgentOutputBase,
>(agent: CreateAgentParams<TTools, TInput, TOutput>) {
    const id = agent.id ?? uuid();
    return { ...agent, id } as Agent<TTools, TInput, TOutput>;
}
