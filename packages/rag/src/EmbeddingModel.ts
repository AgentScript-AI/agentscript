import { EnvVariables } from '@agentscript.ai/core';
import type { Embeddings } from '@langchain/core/embeddings';
import { OpenAIEmbeddings } from '@langchain/openai';

import { defineService } from '@nzyme/ioc';

export const EmbeddingModel = defineService<Embeddings>({
    name: 'EmbeddingModel',
    setup({ inject }) {
        const env = inject(EnvVariables);

        return new OpenAIEmbeddings({
            modelName: 'text-embedding-3-small',
            apiKey: env.OPENAI_API_KEY,
        });
    },
});
