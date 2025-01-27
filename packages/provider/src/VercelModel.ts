import type { LanguageModelV1, LanguageModelV1Message } from '@ai-sdk/provider';
import { assert } from '@nzyme/utils';

import { joinLines } from '@agentscript-ai/utils';

import type { LanguageModel } from './LanguageModel.js';

/**
 * Vercel model type.
 */
export type VercelModel = LanguageModelV1;

/**
 * Checks if a model is a Vercel model.
 * @param model - Model to check.
 * @returns True if the model is a Vercel model, false otherwise.
 */
export function isVercelModel(model: VercelModel | object): model is VercelModel {
    return (
        'doGenerate' in model &&
        typeof model.doGenerate === 'function' &&
        typeof model.provider === 'string' &&
        model.specificationVersion === 'v1'
    );
}

/**
 * Normalizes a Vercel model.
 * @param model - Vercel model to normalize.
 * @returns Normalized language model.
 */
export function normalizeVercelModel(model: VercelModel): LanguageModel {
    return {
        name: model.modelId,
        invoke: async params => {
            const messages: LanguageModelV1Message[] = [];

            if (params.systemPrompt) {
                messages.push({
                    role: 'system',
                    content: joinLines(params.systemPrompt),
                });
            }

            for (const message of params.messages) {
                messages.push({
                    role: message.role,
                    content: [
                        {
                            type: 'text',
                            text: message.content,
                        },
                    ],
                });
            }

            const response = await model.doGenerate({
                inputFormat: 'messages',
                prompt: messages,
                mode: {
                    type: 'regular',
                },
            });

            assert(response.text, 'No text response from model');

            return {
                role: 'assistant',
                content: response.text,
            };
        },
    };
}
