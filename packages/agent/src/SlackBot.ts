import slack from '@slack/bolt';
import { markdownToBlocks } from '@tryfabric/mack';

import { SlackReceiver, SlackUsers } from '@chorus/slack';
import { defineService } from '@nzyme/ioc';

import { Agent } from './Agent.js';

export const SlackBot = defineService({
    name: 'SlackBot',
    setup({ inject }) {
        const agent = inject(Agent);
        const slackUsers = inject(SlackUsers);
        const slackReceiver = inject(SlackReceiver);

        const slackApp = new slack.App({
            receiver: slackReceiver,
            token: process.env.SLACK_BOT_TOKEN,
            signingSecret: process.env.SLACK_SIGNING_SECRET,
            appToken: process.env.SLACK_APP_TOKEN,
        });

        slackApp.message(async ({ message, say }) => {
            if (message.type !== 'message') {
                return;
            }

            if (message.subtype || !message.text) {
                return;
            }

            const user = await slackUsers.getUser(message.user);

            const response = await agent({
                channelId: message.channel,
                threadId: message.thread_ts ?? message.ts,
                user,
                messageId: message.ts,
                messageContent: message.text,
            });

            if (typeof response === 'string') {
                await say({
                    blocks: await markdownToBlocks(response),
                    thread_ts: message.ts,
                    mrkdwn: true,
                });
            } else {
                // TODO: Handle complex response
            }
        });

        return slackApp;
    },
});
