import type { EmptyObject } from '@nzyme/types';

import type { Agent } from './agentTypes.js';
import { createAgentInternal } from './createAgentInternal.js';
import type {
    AgentDefinition,
    AgentInputBase,
    AgentOutputBase,
    AgentTools,
} from './defineAgent.js';
import { renderRuntime } from '../modules/renderRuntime.js';
import type { Script } from '../parser/astTypes.js';

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
 * @param options - Agent options.
 * @returns New agent.
 */
export function createAgent<
    TTools extends AgentTools,
    TInput extends AgentInputBase = EmptyObject,
    TOutput extends AgentOutputBase = undefined,
>(options: CreateAgentOptions<TTools, TInput, TOutput>): Agent<TTools, TInput, TOutput> {
    return createAgentInternal({
        ...options,
        runtime: renderRuntime(options),
    });
}
