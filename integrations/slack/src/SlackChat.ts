import type { KnownBlock } from '@slack/web-api';
import { markdownToBlocks } from '@tryfabric/mack';

import type { ChatBlock, ChatMessageWithContent, ChatPostMessageParams } from '@chorus/core';
import { Chat } from '@chorus/core';
import { defineService } from '@nzyme/ioc';
import { assertValue, identity } from '@nzyme/utils';

import { SlackClient } from './SlackClient.js';
import { SlackUsers } from './SlackUsers.js';
import type { SlackBlock } from './types.js';

export const SlackChat = defineService({
    name: 'SlackChat',
    for: Chat,
    setup({ inject }) {
        const slack = inject(SlackClient);
        const users = inject(SlackUsers);

        return identity<Chat>({
            async postMessage(message) {
                const result = await slack.chat.postMessage({
                    blocks: await messageToBlocks(message),
                    channel: message.channelId,
                    thread_ts: message.threadId,
                    mrkdwn: true,
                });

                if (result.error || !result.ts) {
                    throw new Error(result.error);
                }

                const self = await users.getSelfUser();

                return {
                    channelId: message.channelId,
                    threadId: message.threadId,
                    messageId: result.ts,
                    userId: self.id,
                    timestamp: parseTimestamp(result.ts),
                };
            },
            async updateMessage(message) {
                const result = await slack.chat.update({
                    blocks: await messageToBlocks(message),
                    channel: message.channelId,
                    ts: message.messageId,
                });

                if (result.error || !result.ts) {
                    throw new Error(result.error);
                }

                const self = await users.getSelfUser();

                return {
                    channelId: message.channelId,
                    threadId: message.threadId,
                    messageId: result.ts,
                    userId: self.id,
                    timestamp: parseTimestamp(result.ts),
                };
            },
            async getMessages(params) {
                const history = await slack.conversations.replies({
                    channel: params.channelId,
                    ts: params.threadId,
                    latest: params.from?.valueOf().toString(),
                });

                if (history.error) {
                    throw new Error(history.error);
                }

                const messages = history.messages ?? [];

                return messages.map<ChatMessageWithContent>(message => ({
                    channelId: params.channelId,
                    threadId: params.threadId,
                    messageId: assertValue(message.ts),
                    userId: assertValue(message.user),
                    timestamp: parseTimestamp(assertValue(message.ts)),
                    content: message.text ?? '',
                }));
            },
            getChannelType(channelId) {
                if (channelId.startsWith('D')) {
                    return 'DM';
                }

                return 'CHANNEL';
            },
            getUser: users.getUser,
            getSelfUser: users.getSelfUser,
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

        function parseTimestamp(ts: string) {
            const timestamp = Number(ts.split('.')[0]);
            return new Date(timestamp);
        }
    },
});
