import type { EmptyObject } from '@nzyme/types';
import { v7 as uuid } from 'uuid';

import type { Agent } from './agentTypes.js';
import type {
    AgentDefinition,
    AgentInputBase,
    AgentOutputBase,
    AgentTools,
} from './defineAgent.js';
import type { Script } from '../parser/astTypes.js';
import type { StackFrame } from '../runtime/runtimeTypes.js';

/**
 * Parameters for {@link createAgent}.
 */
export type CreateAgentOptions<
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

/**
 * Create a new agent.
 * @param agent - Agent options.
 * @returns New agent.
 */
export function createAgent<
    TTools extends AgentTools,
    TInput extends AgentInputBase = EmptyObject,
    TOutput extends AgentOutputBase = undefined,
>(agent: CreateAgentOptions<TTools, TInput, TOutput>): Agent<TTools, TInput, TOutput> {
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
