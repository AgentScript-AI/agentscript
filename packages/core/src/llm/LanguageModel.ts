import { defineInterface } from '@nzyme/ioc';

import type { Message } from './llmTypes.js';

/**
 * Parameters for {@link LanguageModel.invoke}.
 */
export interface LanguageModelInvokeParams {
    /**
     * System prompt to use.
     */
    systemPrompt?: string;
    /**
     * Messages to use
     */
    messages: Message[];
}

/**
 * Language model.
 */
export interface LanguageModel {
    /**
     * Name of the language model
     */
    name: string;
    /**
     * Invoke the language model.
     * @returns Response from the language model.
     */
    invoke(params: LanguageModelInvokeParams): Promise<Message>;
}

/**
 * Language model injectable.
 */
export const LanguageModel = defineInterface<LanguageModel>({
    name: 'LanguageModel',
});
