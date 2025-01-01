import { type AIMessageChunk, SystemMessage } from '@langchain/core/messages';

import type {
    AgentMessage,
    ChatMessageWithContent,
    ChatUser,
    ToolCall,
    ToolChatAction,
} from '@agentscript.ai/core';
import { Chat, Logger, randomUid } from '@agentscript.ai/core';
import { randomString } from '@nzyme/crypto-utils';
import { defineService } from '@nzyme/ioc';
import { createStopwatch, mapNotNull } from '@nzyme/utils';

import { AgentStateStore } from './AgentStateStore.js';
import { LangModelProvider } from './LangModelProvider.js';
import { ToolRegistry } from './services/ToolRegistry.js';
import { convertEventToPrompt } from './utils/convertEventToPrompt.js';

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

        async function newMessage(message: ChatMessageWithContent) {
            const state = await stateStore.getStateForChat(message.channelId, message.threadId);
            const messages: ChatMessageWithContent[] = [];

            if (message.messageId !== message.threadId) {
                // Not a first message in the thread
                // We need to get old messages in the thread
                const lastMessageInThread = state.events.findLast(
                    event =>
                        event.type === 'HUMAN_MESSAGE' &&
                        event.message.channelId === message.channelId &&
                        event.message.threadId === message.threadId,
                );

                const thread = await chat.getMessages({
                    channelId: message.channelId,
                    threadId: message.threadId,
                    from: lastMessageInThread?.timestamp,
                });

                for (const message of thread) {
                    messages.push(message);
                }
            } else {
                messages.push(message);
            }

            const chatMessage = await chat.postMessage({
                channelId: message.channelId,
                threadId: message.threadId,
                blocks: ['Give me a moment to think... 🤔'],
            });

            const self = await chat.getSelfUser();

            for (const message of messages) {
                if (!state.users[message.userId]) {
                    state.users[message.userId] = await chat.getUser(message.userId);
                }

                // Skip messages that we already have in the state
                if (
                    state.events.find(
                        event =>
                            event.message &&
                            event.message.messageId === message.messageId &&
                            event.message.channelId === message.channelId &&
                            event.message.threadId === message.threadId,
                    )
                ) {
                    continue;
                }

                if (self.id === message.userId) {
                    state.events.push({
                        type: 'AGENT_MESSAGE',
                        uid: randomUid(),
                        timestamp: message.timestamp,
                        content: message.content,
                        message: {
                            channelId: message.channelId,
                            threadId: message.threadId,
                            messageId: message.messageId,
                            userId: message.userId,
                            timestamp: message.timestamp,
                        },
                    });
                } else {
                    state.events.push({
                        type: 'HUMAN_MESSAGE',
                        uid: randomUid(),
                        timestamp: message.timestamp,
                        content: message.content,
                        message: {
                            channelId: message.channelId,
                            threadId: message.threadId,
                            messageId: message.messageId,
                            userId: message.userId,
                            timestamp: message.timestamp,
                        },
                    });
                }
            }

            const date = new Date().toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
            });

            const systemPrompt = [
                'You are a helpful assistant with access to a set of tools designed to assist in completing tasks.',
                // 'You do not respond to greetings or small talk.',
                'Use the tools at your disposal to achieve the task requested.',
                // 'Use **bold** to highlight important words.',
                'If you are unsure of the answer, ask the user for clarification.',
                'Answer strictly using the internal knowledge base and do not make up information.',
                'You work for a startup called agentscript. It is a platform for creating and sharing AI agents.',
                'You use corporate jargon and acronyms as much as possible.',
                `Your name is ${self.name}. Whenever there is <@${self.id}> in the conversation, it is you.`,
                `Today's date is ${date}.`,
            ];

            systemPrompt.push('In the conversation, you are talking to the following people:');
            const users = Object.values(state.users).filter(user => user.id !== self.id);
            systemPrompt.push(JSON.stringify(users));
            systemPrompt.push(
                `You can mention them using <@USER_ID> (for example <@${users[0].id}>)`,
            );

            const threads = new Set<string>(
                mapNotNull(state.events, event => event.message?.threadId),
            );

            if (threads.size > 1) {
                systemPrompt.push('Conversation takes place in multiple threads.');
            }

            logger.debug('Invoking agent', {
                channelId: message.channelId,
                threadId: message.threadId,
            });

            const stopwatch = createStopwatch();

            try {
                for (let i = 0; i < 5; i++) {
                    logger.debug('Invoking LLM');

                    const prompts = [`System: ${systemPrompt.join('\n')}`];

                    for (const event of state.events) {
                        const message = event.message;
                        const threadInfo =
                            threads.size > 1 && message?.threadId
                                ? `, Thread ${message.threadId}`
                                : '';

                        switch (event.type) {
                            case 'HUMAN_MESSAGE':
                                prompts.push(
                                    `Human ${event.message.userId}${threadInfo}: ${event.content}`,
                                );
                                break;

                            case 'AGENT_MESSAGE': {
                                const botInfo =
                                    message?.userId === self.id ? `You` : `Bot ${message?.userId}`;

                                prompts.push(`${botInfo} ${threadInfo}: ${event.content}`);
                                break;
                            }

                            case 'TOOL_EVENT':
                                prompts.push(`Tool: ${event.content}`);
                                break;
                        }
                    }

                    const response = await llm.invoke([
                        new SystemMessage({
                            content: systemPrompt.join('\n'),
                        }),
                        ...mapNotNull(state.events, convertEventToPrompt),
                    ]);

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
                                channelId: message.channelId,
                                threadId: message.threadId,
                                messageId: chatMessage.messageId,
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
