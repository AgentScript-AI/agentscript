import { v7 as uuid } from 'uuid';

import type { Agent, AgentRuntime, AgentState } from './agentTypes.js';
import type { CreateAgentOptions } from './createAgent.js';
import type { AgentInputBase, AgentOutputBase, AgentTools } from './defineAgent.js';
import { planMetadata, promptMetadata } from '../meta/defaultMetadata.js';
import type { StackFrame } from '../runtime/runtimeTypes.js';

/**
 * Parameters for {@link createAgentInternal}.
 */
export type CreateAgentInternalOptions = CreateAgentOptions<
    AgentTools,
    AgentInputBase,
    AgentOutputBase
> & {
    /**
     * Runtime of the agent.
     */
    readonly runtime: AgentRuntime;

    /**
     * Chain of agents.
     */
    readonly chain?: AgentState[];
};

/**
 * Create a new agent.
 * @param options - Agent options.
 * @returns New agent.
 */
export function createAgentInternal(options: CreateAgentInternalOptions): Agent {
    const id = options.id ?? uuid();
    const startedAt = new Date();
    const root: StackFrame = {
        trace: '0',
        status: 'running',
        startedAt,
        updatedAt: startedAt,
    };

    if (options.output) {
        root.variables = { result: undefined };
    }

    const agent: Agent = {
        id,
        def: options,
        script: options.script,
        status: 'running',
        metadata: {},
        root,
        createdAt: new Date(),
        runtime: options.runtime,
        chain: options.chain,
    };

    if (options.plan) {
        planMetadata(agent, options.plan);
    }

    if (options.prompt) {
        promptMetadata(agent, options.prompt);
    }

    return agent;
}
