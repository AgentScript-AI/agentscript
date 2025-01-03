import { Anthropic } from '@anthropic-ai/sdk';

import { LanguageModel } from '@agentscript-ai/core';
import type { Injected } from '@nzyme/ioc';
import { constValue, defineService } from '@nzyme/ioc';

/**
 * Anthropic language model.
 */
export type AnthropicModel = Injected<typeof AnthropicModel>;

/**
 * Anthropic language model.
 */
export const AnthropicModel = defineService({
    name: 'AnthropicModel',
    implements: LanguageModel,
    deps: {
        model: constValue('claude-3-5-sonnet-latest'),
        apiKey: constValue<string | undefined>(undefined),
        maxTokens: constValue(1024),
    },
    setup: ({ model, apiKey, maxTokens }) => {
        const anthropic = new Anthropic({ apiKey });

        return {
            name: `anthropic-${model}`,
            invoke: async params => {
                const response = await anthropic.messages.create({
                    model,
                    system: Array.isArray(params.systemPrompt)
                        ? params.systemPrompt.join('\n')
                        : params.systemPrompt,
                    messages: params.messages.map(message => ({
                        role: message.role,
                        content: message.content,
                    })),
                    max_tokens: maxTokens,
                });

                const content = response.content
                    .filter(block => block.type === 'text')
                    .map(block => block.text)
                    .join('\n');

                return {
                    role: 'assistant',
                    content,
                };
            },
        };
    },
});
