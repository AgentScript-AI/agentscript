import type { BaseChatModel } from '@langchain/core/language_models/chat_models';
import type { MessageFieldWithRole } from '@langchain/core/messages';

import { joinLines } from '@agentscript-ai/utils';

import type { LanguageModel } from './LanguageModel.js';

/**
 * LangChain model type.
 */
export type LangChainModel = BaseChatModel;

/**
 * Checks if a model is a LangChain model.
 * @param model - Model to check.
 * @returns True if the model is a LangChain model, false otherwise.
 */
export function isLangChainModel(model: LangChainModel | object): model is LangChainModel {
    return (
        (model as LangChainModel).lc_id !== undefined &&
        (model as LangChainModel).lc_namespace !== undefined
    );
}

/**
 * Normalizes a LangChain model.
 * @param model - LangChain model to normalize.
 * @returns Normalized language model.
 */
export function normalizeLangChainModel(model: LangChainModel): LanguageModel {
    return {
        name: getModelName(model),
        invoke: async params => {
            const messages: MessageFieldWithRole[] = [];

            if (params.systemPrompt) {
                messages.push({
                    role: 'system',
                    content: [
                        {
                            type: 'text',
                            text: joinLines(params.systemPrompt),
                        },
                    ],
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

            const response = await model.invoke(messages);

            if (typeof response.content !== 'string') {
                throw new Error('Invalid content response from model');
            }

            return {
                role: 'assistant',
                content: response.content,
            };
        },
    };
}

function getModelName(model: LangChainModel): string {
    if ('modelName' in model) {
        return String(model.modelName);
    }

    if ('model' in model) {
        return String(model.model);
    }

    return model.lc_id[model.lc_id.length - 1];
}
