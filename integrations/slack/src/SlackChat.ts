import { Chat, ChatBlock, ChatPostMessageParams } from '@chorus/core';
import { defineService } from '@nzyme/ioc';
import { SlackClient } from './SlackClient.js';
import { markdownToBlocks } from '@tryfabric/mack';
import { parseChatId } from './utils/parseChatId.js';
import { identity } from '@nzyme/utils';
import { SlackBlock } from './types.js';
import { KnownBlock } from '@slack/web-api';

export const SlackChat = defineService({
    name: 'SlackChat',
    for: Chat,
    setup({ inject }) {
        const slack = inject(SlackClient);

        return identity<Chat>({
            async postMessage(message) {
                const { channelId, threadId } = parseChatId(message.chatId);

                const result = await slack.chat.postMessage({
                    blocks: await messageToBlocks(message),
                    channel: channelId,
                    thread_ts: threadId,
                    mrkdwn: true,
                });

                if (result.error || !result.ts) {
                    throw new Error(result.error);
                }

                return {
                    chatId: message.chatId,
                    id: result.ts,
                };
            },
            async updateMessage(message) {
                const { channelId, threadId } = parseChatId(message.chatId);

                const result = await slack.chat.update({
                    blocks: await messageToBlocks(message),
                    channel: channelId,
                    ts: message.messageId,
                });

                if (result.error || !result.ts) {
                    throw new Error(result.error);
                }

                return {
                    chatId: message.chatId,
                    id: result.ts,
                };
            },
            getChatInfo(chatId) {
                const { channelId } = parseChatId(chatId);

                if (channelId.startsWith('D')) {
                    return {
                        type: 'DM',
                    };
                }

                return {
                    type: 'CHANNEL',
                    prompt: `You are currently in the channel ${channelId}.`,
                };
            },
        });

        async function messageToBlocks(message: ChatPostMessageParams) {
            const blocks: SlackBlock[] = [];

            for (const block of message.blocks) {
                if (typeof block === 'string') {
                    blocks.push(...(await markdownToBlocks(block)));
                } else {
                    blocks.push(mapBlock(block));
                }
            }

            return blocks;
        }

        function mapBlock(block: ChatBlock): KnownBlock {
            switch (block.type) {
                case 'actions':
                    return {
                        type: 'actions',
                        elements: block.elements.map(element => {
                            return {
                                type: 'button',
                                text: {
                                    type: 'plain_text',
                                    text: element.text,
                                },
                                action_id: element.action,
                                value: element.value,
                                style: element.style,
                            };
                        }),
                    };
                case 'divider':
                    return {
                        type: 'divider',
                    };
            }
        }
    },
});
