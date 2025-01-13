import type { EmptyObject, LiteralExclude, LiteralPick } from '@nzyme/types';
import { v7 as uuid } from 'uuid';

import type { StackFrame, StackFrameStatus } from './runtimeTypes.js';
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
};

type AgentStateComplete<TOutput extends AgentOutputBase> = {
    /**
     * Status of the agent execution.
     */
    status: LiteralPick<StackFrameStatus, 'finished'>;
    /**
     * Output of the agent.
     */
    output: AgentOutput<TOutput>;
};

type AgentStateRunning = {
    /**
     * Status of the agent execution.
     */
    status: LiteralExclude<StackFrameStatus, 'finished'>;
    /**
     * Output of the agent.
     */
    output?: undefined;
};

/**
 * Agent to be executed.
 */
export type Agent<
    TTools extends AgentTools = AgentTools,
    TInput extends AgentInputBase = AgentInputBase,
    TOutput extends AgentOutputBase = AgentOutputBase,
> = {
    /**
     * Definition of the agent.
     */
    readonly def: AgentDefinition<TTools, TInput, TOutput>;
    /**
     * ID of the agent.
     */
    readonly id: string;
    /**
     * AgentScript script to execute.
     */
    readonly script: Script;
    /**
     * Plan for the agent.
     */
    readonly plan?: string;
    /**
     * Root frame of the agent execution stack.
     * Execution progress is stored here.
     */
    root: StackFrame;
} & (AgentStateComplete<TOutput> | AgentStateRunning);

/**
 * Create a new agent.
 * @param agent - Agent options.
 * @returns New agent.
 */
export function createAgent<
    TTools extends AgentTools,
    TInput extends AgentInputBase = EmptyObject,
    TOutput extends AgentOutputBase = undefined,
>(agent: CreateAgentParams<TTools, TInput, TOutput>): Agent<TTools, TInput, TOutput> {
    const id = agent.id ?? uuid();
    const startedAt = new Date();
    const root: StackFrame = {
        trace: '0',
        status: 'running',
        startedAt,
        updatedAt: startedAt,
    };

    if (agent.output) {
        root.variables = { result: undefined };
    }

    return {
        id,
        def: agent,
        script: agent.script,
        plan: agent.plan,
        status: 'running',
        root,
    };
}
