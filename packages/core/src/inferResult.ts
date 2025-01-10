import { type Schema, coerce } from '@agentscript-ai/schema';

import type { LanguageModel } from './LanguageModel.js';
import { createRenderContext } from './modules/renderContext.js';
import { renderType } from './modules/renderType.js';

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

/**
 * Infer a structured result from a given prompt.
 * @param params - Parameters for {@link inferResult}.
 * @returns Inferred result.
 */
export async function inferResult<T extends Schema>(params: InferResultParams<T>) {
    const renderContext = createRenderContext();
    const resultType = renderType({
        schema: params.result,
        ctx: renderContext,
        nameHint: 'Result',
    });

    const systemPrompt = [
        'Given the following types:',
        `\`\`\`typescript\n${renderContext.code}\n\`\`\``,
        `Answer strictly in a structured format of the type ${resultType}. Do not include any other text or comments.`,
        '',
        params.prompt,
    ].join('\n');

    const response = await params.llm.invoke({
        systemPrompt,
        messages: [{ role: 'user', content: params.prompt }],
    });

    const json = JSON.parse(response.content) as unknown;
    const result = coerce(params.result, json);

    return result;
}
