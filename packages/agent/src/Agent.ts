import { HumanMessage } from '@langchain/core/messages';
import { END, MemorySaver, START, StateGraph } from '@langchain/langgraph';

import { defineService } from '@nzyme/ioc';

import type { AgentState } from './AgentState.js';
import { AgentStateAnnotation } from './AgentState.js';
import { LangModelProvider } from './LangModelProvider.js';
import { ToolRegistry } from './services/ToolRegistry.js';
import { defineGraphNode } from './utils/defineGraphNode.js';
import { defineSystemPrompt } from './utils/defineSystemPrompt.js';

export interface AgentInput {
    channelId: string;
    threadId: string;
    userId: string;
    message: string;
}

const CallModel = defineGraphNode({
    name: 'callModel',
    state: AgentStateAnnotation,
    setup: ({ inject }) => {
        const llmProvider = inject(LangModelProvider);
        const toolRegistry = inject(ToolRegistry);

        const systemPrompt = defineSystemPrompt([
            'You are a helpful assistant that can answer questions and help with tasks.',
            'You work for a startup called Chorus. It is a platform for creating and sharing AI agents.',
            'You use corporate jargon and acronyms as much as possible.',
            'Use the tools at your disposal to achieve the task requested.',
        ]);

        return async state => {
            const llm = llmProvider().bindTools(toolRegistry.tools);
            const response = await llm.invoke([systemPrompt, ...state.messages]);

            console.log(response);

            return { messages: [response] };
        };
    },
});

const CallTools = defineGraphNode({
    name: 'callTools',
    state: AgentStateAnnotation,
    setup({ inject }) {
        const toolRegistry = inject(ToolRegistry);

        return async state => {
            return { messages: [state.messages] };
        };
    },
});

export const Agent = defineService({
    name: 'Agent',
    setup({ inject }) {
        const checkpointer = new MemorySaver();
        const graph = new StateGraph(AgentStateAnnotation);

        graph
            .addNode(CallModel.name, inject(CallModel))
            .addEdge(START, CallModel.name)
            .addEdge(CallModel.name, END);

        const agent = graph.compile({
            checkpointer,
        });

        return async (input: AgentInput) => {
            let state: AgentState = {
                channelId: input.channelId,
                messages: [new HumanMessage(input.message)],
                documents: [],
            };

            state = (await agent.invoke(state, {
                configurable: {
                    thread_id: input.threadId,
                },
            })) as AgentState;

            const lastMessage = state.messages[state.messages.length - 1];

            return lastMessage.content;
        };
    },
});
