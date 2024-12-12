import { HumanMessage } from '@langchain/core/messages';

import type { AgentState } from '@chorus/core';
import { Chat, Logger } from '@chorus/core';
import { type SlackUser, getChannelType } from '@chorus/slack';
import { defineService } from '@nzyme/ioc';
import { createStopwatch } from '@nzyme/utils';

import { LangModelProvider } from './LangModelProvider.js';
import { ToolRegistry } from './services/ToolRegistry.js';
import { defineSystemPrompt } from './utils/defineSystemPrompt.js';

export interface AgentInput {
    channelId: string;
    threadId: string;
    messageId: string;
    messageContent: string;
    user: SlackUser;
}

export const Agent = defineService({
    name: 'Agent',
    setup({ inject }) {
        const llmProvider = inject(LangModelProvider);
        const toolRegistry = inject(ToolRegistry);
        const chat = inject(Chat);
        const states = new Map<string, AgentState>();
        const logger = inject(Logger);

        const llm = llmProvider().bindTools(toolRegistry.tools);

        // const checkpointer = new MemorySaver();
        // const graph = new StateGraph(AgentStateAnnotation);

        // graph
        //     .addNode(CallModel.name, inject(CallModel))
        //     .addEdge(START, CallModel.name)
        //     .addEdge(CallModel.name, END);

        // const agent = graph.compile({
        //     checkpointer,
        // });

        return async (input: AgentInput) => {
            const chatMessage = await chat.postMessage({
                channelId: input.channelId,
                threadId: input.threadId,
                content: 'Give me a moment to think... 🤔',
            });

            const date = new Date().toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
            });

            const channelType = getChannelType(input.channelId);
            const channelInfo =
                channelType === 'dm' ? [`You are talking to ${formatUser(input.user)}.`] : [];

            const systemPrompt = defineSystemPrompt([
                'You are a helpful assistant with access to a set of tools designed to assist in completing tasks.',
                // 'You do not respond to greetings or small talk.',
                'Use the tools at your disposal to achieve the task requested.',
                // 'Use **bold** to highlight important words.',
                'If you are unsure of the answer, ask the user for clarification.',
                'Answer strictly using the internal knowledge base and do not make up information.',
                'You work for a startup called Chorus. It is a platform for creating and sharing AI agents.',
                'You use corporate jargon and acronyms as much as possible.',
                `You are currently in the channel ${input.channelId} and thread ${input.threadId}.`,
                `Today's date is ${date}.`,
                ...channelInfo,
            ]);

            const state = retrieveState(input);

            const message = new HumanMessage({
                id: input.messageId,
                content: input.messageContent,
                // name: input.user.name,
            });

            state.messages.push(message);

            logger.debug('Invoking agent', {
                threadId: state.threadId,
                channelId: state.channelId,
            });

            const stopwatch = createStopwatch();

            try {
                for (let i = 0; i < 5; i++) {
                    logger.debug('Invoking LLM');

                    const response = await llm.invoke([systemPrompt, ...state.messages]);

                    state.messages.push(response);

                    const toolCalls = response.tool_calls;

                    if (toolCalls?.length) {
                        for (const toolCall of toolCalls) {
                            const toolMessage = await toolRegistry.callTool(toolCall, state);
                            state.messages.push(toolMessage);
                        }
                    }

                    if (response.content) {
                        if (typeof response.content === 'string') {
                            await chat.updateMessage({
                                channelId: input.channelId,
                                threadId: input.threadId,
                                messageId: chatMessage.messageId,
                                content: response.content,
                            });
                        }

                        // TODO: Handle complex response
                        return;
                    }
                }

                throw new Error('Agent failed to complete task');
            } finally {
                const duration = stopwatch.format();
                logger.debug('Agent completed in %s', duration, {
                    duration,
                    threadId: state.threadId,
                    channelId: state.channelId,
                });
            }
        };

        function retrieveState(params: AgentInput) {
            const id = `${params.channelId}:${params.threadId}`;
            let state = states.get(id);

            if (state) {
                return state;
            }

            state = {
                id,
                channelId: params.channelId,
                threadId: params.threadId,
                messages: [],
            };

            states.set(id, state);

            return state;
        }

        function formatUser(user: SlackUser) {
            if (!user.name) {
                return user.email || user.id;
            }

            if (!user.email) {
                return user.name;
            }

            if (user.description) {
                return `${user.name} (${user.email}) - ${user.description}`;
            }

            return `${user.name} (${user.email})`;
        }
    },
});
