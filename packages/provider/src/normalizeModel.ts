import type {
    LanguageModelV1Message as VercelMessage,
    LanguageModelV1 as VercelModel,
} from '@ai-sdk/provider';
import { defineInterface } from '@nzyme/ioc';
import { assert } from '@nzyme/utils';

import { joinLines } from '@agentscript-ai/utils';

import type { LanguageModel } from './LanguageModel.js';

/**
 * Language model input.
 * You can pass any language model from Vercel AI SDK.
 */
export type LanguageModelInput = VercelModel | LanguageModel;

/**
 * Language model input injectable.
 */
export const LanguageModelInput = defineInterface<LanguageModelInput>({
    name: 'LanguageModelInput',
});

/**
 * Normalizes a language model.
 * @param model - Language model to normalize.
 * @returns Normalized language model.
 */
export function normalizeModel(model: LanguageModelInput): LanguageModel {
    if (isVercelModel(model)) {
        return normalizeVercelModel(model);
    }

    return model;
}

function isVercelModel(model: LanguageModelInput): model is VercelModel {
    return (
        'doGenerate' in model &&
        typeof model.doGenerate === 'function' &&
        typeof model.provider === 'string' &&
        model.specificationVersion === 'v1'
    );
}

function normalizeVercelModel(model: VercelModel): LanguageModel {
    return {
        name: model.provider,
        invoke: async params => {
            const messages: VercelMessage[] = [];

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
