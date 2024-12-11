import { Chat } from '@chorus/core';
import { defineService } from '@nzyme/ioc';
import { SlackClient } from './SlackClient.js';
import { markdownToBlocks } from '@tryfabric/mack';

export const SlackChat = defineService({
    name: 'SlackChat',
    for: Chat,
    setup({ inject }) {
        const slack = inject(SlackClient);

        return {
            async sendMessage(message) {
                const result = await slack.chat.postMessage({
                    blocks: await markdownToBlocks(message.content),
                    channel: message.channelId,
                    thread_ts: message.threadId,
                    mrkdwn: true,
                });

                if (result.error || !result.ts) {
                    throw new Error(result.error);
                }

                return {
                    messageId: result.ts,
                };
            },
        };
    },
});
