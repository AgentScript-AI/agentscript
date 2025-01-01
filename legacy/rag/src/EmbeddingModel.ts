import type { Embeddings } from '@langchain/core/embeddings';
import { OpenAIEmbeddings } from '@langchain/openai';

import { EnvVariables } from '@agentscript.ai/core';
import { defineService } from '@nzyme/ioc';

export const EmbeddingModel = defineService<Embeddings>({
    name: 'EmbeddingModel',
    deps: {
        env: EnvVariables,
    },
    setup({ env }) {
        return new OpenAIEmbeddings({
            modelName: 'text-embedding-3-small',
            apiKey: env.OPENAI_API_KEY,
        });
    },
});
