import { z } from 'zod';

import { KnowledgeRetriever } from '@chorus/rag';

import { defineTool } from '../utils/defineTool.js';

export const SearchKnowledgeTool = defineTool({
    name: 'search_knowledge',
    description: 'Search for information in the knowledge base',
    schema: z.object({
        query: z.string(),
    }),
    setup({ inject }) {
        const knowledgeRetriever = inject(KnowledgeRetriever);

        return async input => {
            const docs = await knowledgeRetriever({
                query: input.query,
                limit: 4,
            });

            return { documents: docs };
        };
    },
});
