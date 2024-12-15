import type { AIMessageChunk } from '@langchain/core/messages';

import type { AgentMessage, ChatUser, ToolCall, ToolChatAction } from '@chorus/core';
import { Chat, Logger, randomUid } from '@chorus/core';
import { randomString } from '@nzyme/crypto-utils';
import { defineService } from '@nzyme/ioc';
import { createStopwatch, mapNotNull } from '@nzyme/utils';

import { AgentStateStore } from './AgentStateStore.js';
import { LangModelProvider } from './LangModelProvider.js';
import { ToolRegistry } from './services/ToolRegistry.js';
import { convertEventToPrompt } from './utils/convertEventToPrompt.js';
import { defineSystemPrompt } from './utils/defineSystemPrompt.js';

export interface AgentMessageInput {
    chatId: string;
    messageId: string;
    timestamp: Date;
    content: string;
    user: ChatUser;
}

export const Agent = defineService({
    name: 'Agent',
    setup({ inject }) {
        const llmProvider = inject(LangModelProvider);
        const toolRegistry = inject(ToolRegistry);
        const chat = inject(Chat);
        const stateStore = inject(AgentStateStore);
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

        return {
            newMessage,
            runToolInteraction,
        };

        async function newMessage(input: AgentMessageInput) {
            const state = await stateStore.getStateOrCreateByChatId(input.chatId);

            const chatMessage = await chat.postMessage({
                chatId: input.chatId,
                blocks: ['Give me a moment to think... 🤔'],
            });

            state.events.push({
                type: 'HUMAN_MESSAGE',
                uid: randomUid(),
                timestamp: input.timestamp,
                content: input.content,
                message: {
                    id: input.messageId,
                    chatId: input.chatId,
                },
            });

            const date = new Date().toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
            });

            const channelInfo = chat.getChatInfo(input.chatId);
            const channelDetails =
                channelInfo.type === 'DM' ? [`You are talking to ${formatUser(input.user)}.`] : [];

            if (channelInfo.prompt) {
                channelDetails.push(channelInfo.prompt);
            }

            const systemPrompt = defineSystemPrompt([
                'You are a helpful assistant with access to a set of tools designed to assist in completing tasks.',
                // 'You do not respond to greetings or small talk.',
                'Use the tools at your disposal to achieve the task requested.',
                // 'Use **bold** to highlight important words.',
                'If you are unsure of the answer, ask the user for clarification.',
                'Answer strictly using the internal knowledge base and do not make up information.',
                'You work for a startup called Chorus. It is a platform for creating and sharing AI agents.',
                'You use corporate jargon and acronyms as much as possible.',
                `Today's date is ${date}.`,
                ...channelDetails,
            ]);

            logger.debug('Invoking agent', {
                chatId: input.chatId,
            });

            const stopwatch = createStopwatch();

            try {
                for (let i = 0; i < 5; i++) {
                    logger.debug('Invoking LLM');

                    const prompts = [
                        systemPrompt,
                        ...mapNotNull(state.events, convertEventToPrompt),
                    ];

                    const response = await llm.invoke(prompts);

                    logger.debug('LLM response %O', {
                        response: response.content,
                    });

                    if (response.content) {
                        const responseEvent: AgentMessage = {
                            uid: response.id || randomString(12),
                            timestamp: new Date(),
                            type: 'AGENT_MESSAGE',
                            content: convertResponseContent(response),
                        };

                        state.events.push(responseEvent);

                        if (typeof response.content === 'string') {
                            await chat.updateMessage({
                                chatId: input.chatId,
                                messageId: chatMessage.id,
                                blocks: [response.content],
                            });
                        }
                    }

                    let requireResponse = false;

                    const toolCalls = response.tool_calls;
                    if (toolCalls?.length) {
                        for (const toolCall of toolCalls) {
                            const toolEvent: ToolCall = {
                                type: 'TOOL_CALL',
                                uid: toolCall.id || randomString(12),
                                timestamp: new Date(),
                                tool: toolCall.name,
                                params: toolCall.args,
                            };

                            state.events.push(toolEvent);
                            const toolResult = await toolRegistry.invoke({
                                call: toolEvent,
                                state,
                            });

                            if (toolResult?.requireResponse) {
                                requireResponse = true;
                            }
                        }
                    }

                    if (!requireResponse) {
                        return;
                    }
                }

                throw new Error('Agent failed to complete task');
            } finally {
                const duration = stopwatch.format();
                logger.debug('Agent completed in %s', duration, { duration });
            }
        }

        async function runToolInteraction(params: ToolChatAction) {
            const state = await stateStore.getState(params.stateId);
            if (!state) {
                throw new Error(`State ${params.stateId} not found`);
            }

            const toolCall = state.events.find(
                event => event.type === 'TOOL_CALL' && event.uid === params.toolCallId,
            ) as ToolCall | undefined;
            if (!toolCall) {
                throw new Error(`Tool call ${params.toolCallId} not found`);
            }

            await toolRegistry.interact({
                call: toolCall,
                state,
                interaction: params.params,
            });
        }

        function convertResponseContent(message: AIMessageChunk) {
            if (typeof message.content === 'string') {
                return message.content;
            }

            return mapNotNull(message.content, content => {
                switch (content.type) {
                    case 'image_url':
                        return String(content.image_url);
                    case 'text':
                        return String(content.text);
                }
            }).join('\n');
        }

        function formatUser(user: ChatUser) {
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
