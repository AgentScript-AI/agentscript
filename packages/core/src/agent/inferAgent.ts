import type { EmptyObject } from '@nzyme/types';

import type { LanguageModel } from '../LanguageModel.js';
import type { Agent } from './agentTypes.js';
import type {
    AgentDefinition,
    AgentInputBase,
    AgentOutputBase,
    AgentTools,
} from './defineAgent.js';
import { inferAgentInternal } from './inferAgentInternal.js';

/**
 * Parameters for {@link inferAgent}.
 */
export interface InferAgentParams<
    TTools extends AgentTools,
    TInput extends AgentInputBase,
    TOutput extends AgentOutputBase,
> extends AgentDefinition<TTools, TInput, TOutput> {
    /**
     * ID of the agent.
     * If not provided, it will be generated as a UUID.
     */
    id?: string;
    /**
     * Language model to use.
     */
    model: LanguageModel;
    /**
     * Prompt to infer the agent from.
     */
    prompt: string | string[];
    /**
     * System prompt to use.
     */
    systemPrompt?: string | string[];
}

/**
 * Infer an agent from a given prompt.
 * @param params - Parameters for {@link inferAgent}.
 * @returns Inferred agent.
 */
export async function inferAgent<
    TTools extends AgentTools,
    TInput extends AgentInputBase = EmptyObject,
    TOutput extends AgentOutputBase = undefined,
>(params: InferAgentParams<TTools, TInput, TOutput>) {
    const agent = await inferAgentInternal({
        def: params,
        id: params.id,
        model: params.model,
        systemPrompt: params.systemPrompt,
        prompt: params.prompt,
    });

    return agent as Agent<TTools, TInput, TOutput>;
}
