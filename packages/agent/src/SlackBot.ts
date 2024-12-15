import slack from '@slack/bolt';

import { EnvVariables, TOOL_CHAT_ACTION_TYPE, ToolChatAction } from '@chorus/core';
import { SlackReceiver, SlackUsers, getChatId } from '@chorus/slack';
import { defineService } from '@nzyme/ioc';

import { Agent } from './Agent.js';

export const SlackBot = defineService({
    name: 'SlackBot',
    setup({ inject }) {
        const agent = inject(Agent);
        const env = inject(EnvVariables);
        const slackUsers = inject(SlackUsers);
        const slackReceiver = inject(SlackReceiver);

        const slackApp = new slack.App({
            receiver: slackReceiver,
            token: env.SLACK_BOT_TOKEN,
            signingSecret: env.SLACK_SIGNING_SECRET,
            appToken: env.SLACK_APP_TOKEN,
        });

        slackApp.message(async ({ message }) => {
            if (message.type !== 'message') {
                return;
            }

            if (message.subtype || !message.text) {
                return;
            }

            const user = await slackUsers.getUser(message.user);

            await agent.newMessage({
                chatId: getChatId(message.channel, message.thread_ts ?? message.ts),
                user,
                messageId: message.ts,
                timestamp: new Date(+message.ts),
                content: message.text,
            });
        });

        slackApp.action(TOOL_CHAT_ACTION_TYPE, async ({ action }) => {
            if (action.type === 'button') {
                const payload = ToolChatAction.parse(JSON.parse(action.value ?? '{}'));
                await agent.runToolInteraction(payload);
            }
        });

        return slackApp;
    },
});
