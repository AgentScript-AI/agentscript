import * as z from 'zod';

import { defineTool, randomUid } from '@chorus/core';

import { KnowledgeRetriever } from '../KnowledgeRetriever.js';

export type SearchKnowledgeToolInput = z.infer<typeof SearchKnowledgeToolInput>;
export const SearchKnowledgeToolInput = z.object({
    queries: z
        .array(z.string())
        .describe('Provide 3 queries based on the context to get better results.'),
});

export const SearchKnowledgeTool = defineTool({
    name: 'search_knowledge',
    description: 'Search for information in the knowledge base.',
    input: SearchKnowledgeToolInput,
    setup({ inject }) {
        const knowledgeRetriever = inject(KnowledgeRetriever);

        return {
            async invoke({ input, agent, call }) {
                const results = await Promise.all(
                    input.queries.map(query => knowledgeRetriever({ query })),
                );

                const resultsMap = new Map<bigint, (typeof results)[number][number]>();

                for (const result of results.flat()) {
                    resultsMap.set(result.id, result);
                }

                const documents = [...resultsMap.values()]
                    .sort((a, b) => b.similarity - a.similarity)
                    .slice(0, 10)
                    .map(result => ({
                        type: result.type,
                        title: result.title,
                        url: result.url,
                        content: result.content,
                    }));

                const content = `These are the documents that I found:\n${JSON.stringify(documents)}`;

                agent.events.push({
                    type: 'TOOL_EVENT',
                    timestamp: new Date(),
                    uid: randomUid(),
                    callId: call.uid,
                    content,
                });

                return {
                    requireResponse: true,
                };
            },
        };
    },
});
