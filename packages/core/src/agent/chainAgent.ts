import { codeSnippet } from '@nzyme/markdown';
import type { SomeObject } from '@nzyme/types';

import { joinLines } from '@agentscript-ai/utils';

import type { LanguageModel, LanguageModelMessage } from '../LanguageModel.js';
import type { Agent, AgentState } from './agentTypes.js';
import type { AgentTools } from './defineAgent.js';
import { inferAgentInternal } from './inferAgentInternal.js';
import { rechainAgent } from './rechainAgent.js';

/**
 * Parameters for {@link chainAgent}.
 */
export type ChainAgentParams<TTools extends AgentTools> = {
    /**
     * Agent to chain.
     */
    agent: Agent<TTools>;
    /**
     * Language model to use.
     */
    model: LanguageModel;
    /**
     * Prompt to use.
     */
    prompt: string | string[];
    /**
     * System prompt to use.
     */
    systemPrompt?: string | string[];
};

/**
 * Generates a new response for the agent.
 * @param params - Parameters for {@link chainAgent}.
 * @returns Chained agent.
 * @deprecated Experimental API, subject to change.
 */
export async function chainAgent<TTools extends AgentTools>(params: ChainAgentParams<TTools>) {
    const messages: LanguageModelMessage[] = [];
    const chain: AgentState[] = [];

    if (params.agent.chain) {
        chain.push(...params.agent.chain);
    }

    chain.push(params.agent);

    for (const agent of chain) {
        if (agent.prompt) {
            messages.push({
                role: 'user',
                content: agent.prompt,
            });
        }

        const code = codeSnippet(agent.script.code, 'typescript');
        messages.push({
            role: 'assistant',
            content: joinLines([
                `Here is code that was executed:`,
                code,
                `Use the declared variables when needed in your next step.`,
            ]),
        });
    }

    const agent = await inferAgentInternal({
        id: params.agent.id,
        chain,
        def: {
            tools: params.agent.def.tools,
        },
        model: params.model,
        systemPrompt: params.systemPrompt,
        messages,
        prompt: params.prompt,
    });

    rechainAgent(agent);

    return agent as Agent<TTools, SomeObject, undefined>;
}
