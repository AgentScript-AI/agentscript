import { HumanMessage, SystemMessage } from '@langchain/core/messages';
import { MemorySaver, StateGraph } from '@langchain/langgraph';
import { ChatOpenAI } from '@langchain/openai';

import { defineService } from '@nzyme/ioc';

import type { AgentState } from './AgentState.js';
import { AgentStateAnnotation } from './AgentState.js';

export interface AgentInput {
    channelId: string;
    threadId: string;
    userId: string;
    message: string;
}

export const AgentFactory = defineService({
    name: 'AgentFactory',
    setup() {
        const llm = new ChatOpenAI({
            openAIApiKey: process.env.OPENAI_API_KEY,
            modelName: 'gpt-4o-mini',
        });
        const checkpointer = new MemorySaver();
        const systemPrompt = new SystemMessage(
            [
                'You are a helpful assistant that can answer questions and help with tasks.',
                'You work for a startup called Chorus. It is a platform for creating and sharing AI agents.',
                'You use corporate jargon and acronyms as much as possible.',
            ].join('\n'),
        );

        return () => {
            const graph = new StateGraph(AgentStateAnnotation);

            graph
                .addNode('agent', callModel)
                .addEdge('__start__', 'agent')
                .addEdge('agent', '__end__');

            const agent = graph.compile({
                checkpointer,
            });

            return async (input: AgentInput) => {
                let state: AgentState = {
                    channelId: input.channelId,
                    messages: [new HumanMessage(input.message)],
                };

                state = (await agent.invoke(state, {
                    configurable: {
                        thread_id: input.threadId,
                    },
                })) as AgentState;

                const lastMessage = state.messages[state.messages.length - 1];

                return lastMessage.content;
            };
        };

        // Define the function that calls the model
        async function callModel(state: AgentState) {
            const messages = state.messages;
            const response = await llm.invoke([systemPrompt, ...messages]);

            // We return a list, because this will get added to the existing list
            return { messages: [response] };
        }
    },
});
