import slack from '@slack/bolt';

import { defineService } from '@nzyme/ioc';

import { AgentFactory } from './AgentFactory.js';

export const SlackBot = defineService({
    name: 'SlackBot',
    setup({ inject }) {
        const agentFactory = inject(AgentFactory);

        const app = new slack.App({
            token: process.env.SLACK_BOT_TOKEN,
            signingSecret: process.env.SLACK_SIGNING_SECRET,
            appToken: process.env.SLACK_APP_TOKEN,
            port: 3001,
        });

        const agent = agentFactory();

        app.message(async ({ message, say }) => {
            if (message.type !== 'message') {
                return;
            }

            if (message.subtype || !message.text) {
                return;
            }

            const response = await agent({
                channelId: message.channel,
                threadId: message.thread_ts ?? message.ts,
                userId: message.user,
                message: message.text,
            });

            if (typeof response === 'string') {
                await say({
                    text: response,
                    thread_ts: message.ts,
                    mrkdwn: true,
                });
            } else {
                // TODO: Handle complex response
            }
        });

        return app;
    },
});
