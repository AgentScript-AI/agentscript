import { defineInterface } from '@nzyme/ioc';

/**
 * Parameters for {@link LanguageModel.invoke}.
 */
export interface LanguageModelInvokeParams {
    /**
     * System prompt to use.
     * Can be passed as array of strings to allow for multi-line system prompts.
     */
    systemPrompt?: string | string[];
    /**
     * Messages to use
     */
    messages: LanguageModelMessage[];
}

/**
 * LLM message.
 */
export interface LanguageModelMessage {
    /**
     * Role of the message.
     */
    role: 'user' | 'assistant';
    /**
     * Content of the message.
     */
    content: string;
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
    invoke(params: LanguageModelInvokeParams): Promise<LanguageModelMessage>;
}

/**
 * Language model injectable.
 */
export const LanguageModel = defineInterface<LanguageModel>({
    name: 'LanguageModel',
});
