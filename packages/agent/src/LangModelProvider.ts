import { ChatOpenAI } from '@langchain/openai';

import { defineService } from '@nzyme/ioc';

export const LangModelProvider = defineService({
    name: 'LangModelProvider',
    setup() {
        return () => {
            return new ChatOpenAI({
                openAIApiKey: process.env.OPENAI_API_KEY,
                modelName: 'gpt-4o-mini',
            });
        };
    },
});
