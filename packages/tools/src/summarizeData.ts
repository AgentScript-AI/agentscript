import { defineService } from '@nzyme/ioc';

import { LanguageModel, defineTool } from '@agentscript-ai/core';
import * as s from '@agentscript-ai/schema';
import { getCurrentDatePrompt } from '@agentscript-ai/utils';

/**
 * Tool to summarize any data.
 */
export const summarizeData = defineService({
    name: 'summarizeData',
    deps: {
        llm: LanguageModel,
    },
    setup({ llm }) {
        return defineTool({
            description: 'Summarize any data',
            input: {
                data: s.unknown({
                    description: 'The data to summarize. Can be in any format.',
                }),
                prompt: s.string({
                    description: [
                        'The prompt to use to summarize the data.',
                        'Describe the expected outcome.',
                    ],
                }),
            },
            output: s.string(),
            async handler({ input: { data, prompt } }) {
                const result = await llm.invoke({
                    systemPrompt: [
                        `Your task is to summarize the following data based on the user prompt:`,
                        JSON.stringify(data),
                        getCurrentDatePrompt(),
                    ],
                    messages: [{ role: 'user', content: prompt }],
                });

                return result.content;
            },
        });
    },
});
