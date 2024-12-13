import { Chat, ChatMessage, ChatPostMessageParams } from '@chorus/core';
import { defineService } from '@nzyme/ioc';
import { SlackClient } from './SlackClient.js';
import { markdownToBlocks } from '@tryfabric/mack';

import { parseChatId } from './utils/parseChatId.js';
import { identity } from '@nzyme/utils';
import { slackActionButton } from './components/slackActionButton.js';
import { slackActions } from './components/slackActions.js';

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
            const blocks = await markdownToBlocks(message.content);

            if (message.buttons) {
                blocks.push(
                    slackActions({
                        elements: message.buttons.map(button =>
                            slackActionButton({
                                text: button.label,
                                action: button.action,
                                value: button.value,
                                style: button.style,
                            }),
                        ),
                    }),
                );
            }

            return blocks;
        }
    },
});
