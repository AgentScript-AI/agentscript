import type { Document } from '@langchain/core/documents';
import type { BaseMessage } from '@langchain/core/messages';
import { SystemMessage } from '@langchain/core/messages';
import { Annotation, END, START, StateGraph } from '@langchain/langgraph';
import { z } from 'zod';

import { KnowledgeRetriever } from '@chorus/rag';
import { defineService } from '@nzyme/ioc';

import { LangModelProvider } from '../LangModelProvider.js';

const queryPrompt = `\
Generate 3 search queries to search for to answer the user's question. \
These search queries should be diverse in nature - do not generate \
repetitive ones.`;

const queryResponse = z.object({
    queries: z.array(z.string()),
});

export const ResearchAnnotation = Annotation.Root({
    messages: Annotation<BaseMessage[]>({
        reducer: (x, y) => x.concat(y),
    }),
    queries: Annotation<string[]>({
        reducer: (x, y) => x.concat(y),
    }),
    documents: Annotation<Document[]>({
        reducer: (x, y) => x.concat(y),
    }),
});

export const ResearchGraph = defineService({
    name: 'ResearchGraph',
    setup({ inject }) {
        const knowledgeRetriever = inject(KnowledgeRetriever);
        const llmProvider = inject(LangModelProvider);

        const graph = new StateGraph(ResearchAnnotation)
            .addNode(generateQueries.name, generateQueries)
            .addNode(retrieveDocuments.name, retrieveDocuments)
            .addEdge(START, generateQueries.name)
            .addEdge(generateQueries.name, retrieveDocuments.name)
            .addEdge(retrieveDocuments.name, END)
            .compile();

        return graph;

        async function generateQueries(
            state: typeof ResearchAnnotation.State,
        ): Promise<typeof ResearchAnnotation.Update> {
            const llm = llmProvider().withStructuredOutput(queryResponse);
            const prompt = new SystemMessage(queryPrompt);
            const response = await llm.invoke([prompt, ...state.messages]);

            return { queries: response.queries };
        }

        async function retrieveDocuments(
            state: typeof ResearchAnnotation.State,
        ): Promise<typeof ResearchAnnotation.Update> {
            const documents: Document[] = [];

            await Promise.all(
                state.queries.map(async query => {
                    const docs = await knowledgeRetriever({
                        query,
                        limit: 4,
                    });

                    documents.push(...docs);
                }),
            );

            return { documents };
        }
    },
});
