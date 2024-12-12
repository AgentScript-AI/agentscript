import { z } from 'zod';

import { defineTool } from '@chorus/core';

import { KnowledgeRetriever } from '../KnowledgeRetriever.js';

export type SearchKnowledgeToolInput = z.infer<typeof SearchKnowledgeToolInput>;
export const SearchKnowledgeToolInput = z.object({
    queries: z
        .array(z.string())
        .describe('Provide 3 queries based on the context to get better results.'),
});

export type SearchKnowledgeToolDocument = z.infer<typeof SearchKnowledgeToolDocument>;
export const SearchKnowledgeToolDocument = z.object({
    type: z.string(),
    title: z.string().nullable(),
    url: z.string(),
    content: z.string(),
});

export type SearchKnowledgeToolOutput = z.infer<typeof SearchKnowledgeToolOutput>;
export const SearchKnowledgeToolOutput = z.array(SearchKnowledgeToolDocument);

export const SearchKnowledgeTool = defineTool({
    name: 'search_knowledge',
    description: 'Search for information in the knowledge base.',
    input: SearchKnowledgeToolInput,
    output: SearchKnowledgeToolOutput,
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
                .slice(0, 10)
                .map<SearchKnowledgeToolDocument>(result => ({
                    type: result.type,
                    title: result.title,
                    url: result.url,
                    content: result.content,
                }));
        };
    },
});
