import type { EmptyObject } from '@nzyme/types';
import { v7 as uuid } from 'uuid';

import type { Agent, AgentRuntime } from './agentTypes.js';
import type { CreateAgentOptions } from './createAgent.js';
import type { AgentInputBase, AgentOutputBase, AgentTools } from './defineAgent.js';
import type { StackFrame } from '../runtime/runtimeTypes.js';

/**
 * Parameters for {@link createAgentInternal}.
 */
export type CreateAgentInternalOptions<
    TTools extends AgentTools,
    TInput extends AgentInputBase,
    TOutput extends AgentOutputBase,
> = CreateAgentOptions<TTools, TInput, TOutput> & {
    /**
     * Runtime of the agent.
     */
    readonly runtime: AgentRuntime;
};

/**
 * Create a new agent.
 * @param options - Agent options.
 * @returns New agent.
 */
export function createAgentInternal<
    TTools extends AgentTools,
    TInput extends AgentInputBase = EmptyObject,
    TOutput extends AgentOutputBase = undefined,
>(options: CreateAgentInternalOptions<TTools, TInput, TOutput>): Agent<TTools, TInput, TOutput> {
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

    return {
        id,
        def: options,
        script: options.script,
        plan: options.plan,
        status: 'running',
        root,
        runtime: options.runtime,
    };
}
