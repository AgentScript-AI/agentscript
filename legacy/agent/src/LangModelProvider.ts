import { BaseCallbackHandler } from '@langchain/core/callbacks/base';
import type { Serialized } from '@langchain/core/load/serializable';
import { ChatOpenAI } from '@langchain/openai';

import { EnvVariables, Logger } from '@agentscript-ai/core';
import { defineService } from '@nzyme/ioc';

export const LangModelProvider = defineService({
    name: 'LangModelProvider',
    setup({ inject }) {
        const logger = inject(Logger);
        const env = inject(EnvVariables);

        return () => {
            return new ChatOpenAI({
                openAIApiKey: env.OPENAI_API_KEY,
                modelName: 'gpt-4o-mini',
                callbacks: [new LoggerCallbackHandler(logger)],
            });
        };
    },
});

class LoggerCallbackHandler extends BaseCallbackHandler {
    constructor(private readonly logger: Logger) {
        super();
    }

    readonly name = 'LoggerCallbackHandler';

    override handleLLMStart(llm: Serialized, prompts: string[]) {
        this.logger.debug('LLM Start %O', { prompts });
    }
}
