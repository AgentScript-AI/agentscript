import { getCurrentDatePrompt } from '@agentscript-ai/utils';
import { type Schema, coerce } from '@agentscript-ai/schema';

import type { LanguageModel } from './llm/LanguageModel.js';
import { renderTypeInline } from './modules/renderType.js';
import { createTypedPrompt } from './utils/createTypedPrompt.js';

/**
 * Parameters for {@link inferResult}.
 */
export type InferResultParams<T extends Schema> = {
    /**
     * Language model to use.
     */
    llm: LanguageModel;

    /**
     * Prompt to infer the result.
     */
    prompt: string;

    /**
     * System prompt to use.
     */
    systemPrompt?: string;

    /**
     * Schema of the result.
     */
    result: T;
};

const SYSTEM_PROMPT = `Answer strictly in a structured format following the schema. Do not include any other text or comments.`;

/**
 * Infer a structured result from a given prompt.
 * @param params - Parameters for {@link inferResult}.
 * @returns Inferred result.
 */
export async function inferResult<T extends Schema>(params: InferResultParams<T>) {
    const systemPrompt = createTypedPrompt({
        prompts: [SYSTEM_PROMPT, getCurrentDatePrompt(), params.systemPrompt],
        definitions: renderTypeInline(params.result),
    });

    const response = await params.llm.invoke({
        systemPrompt,
        messages: [{ role: 'user', content: params.prompt }],
    });

    const json = JSON.parse(response.content) as unknown;
    const result = coerce(params.result, json);

    return result;
}
