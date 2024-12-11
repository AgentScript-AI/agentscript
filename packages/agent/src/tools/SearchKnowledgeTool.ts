import { z } from 'zod';

import { KnowledgeRetriever } from '@chorus/rag';

import { defineTool } from '../utils/defineTool.js';

export const SearchKnowledgeTool = defineTool({
    name: 'search_knowledge',
    description: 'Search for information in the knowledge base.',
    schema: z.object({
        queries: z
            .array(z.string())
            .describe('Provide 3 queries based on the context to get better results.'),
    }),
    setup({ inject }) {
        const knowledgeRetriever = inject(KnowledgeRetriever);

        return async input => {
            const results = await Promise.all(
                input.queries.map(query => knowledgeRetriever({ query })),
            );

            const resultsMap = new Map<bigint, (typeof results)[number][number]>();

            for (const result of results.flat()) {
                resultsMap.set(result.id, result);
            }

            return [...resultsMap.values()]
                .sort((a, b) => b.similarity - a.similarity)
                .slice(0, 7)
                .map(result => ({
                    type: result.type,
                    title: result.title,
                    url: result.url,
                    content: result.content,
                }));
        };
    },
});
