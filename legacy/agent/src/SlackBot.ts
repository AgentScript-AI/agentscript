import slack from '@slack/bolt';

import { EnvVariables, TOOL_CHAT_ACTION_TYPE, ToolChatAction } from '@agentscript-ai/core';
import { SlackReceiver, stringifyMessage } from '@agentscript-ai/slack';
import { defineService } from '@nzyme/ioc';
import { assertValue } from '@nzyme/utils';

import { Agent } from './Agent.js';

export const SlackBot = defineService({
    name: 'SlackBot',
    setup({ inject }) {
        const agent = inject(Agent);
        const env = inject(EnvVariables);
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

            const channelId = message.channel;
            const threadId = message.thread_ts ?? message.ts;
            const content = stringifyMessage(message);

            await agent.newMessage({
                messageId: message.ts,
                channelId,
                threadId,
                userId: message.user,
                timestamp: new Date(+message.ts),
                content,
            });
        });

        slackApp.action(TOOL_CHAT_ACTION_TYPE, async ({ action }) => {
            if (action.type === 'button') {
                const payload = ToolChatAction.parse(JSON.parse(action.value ?? '{}'));
                await agent.runToolInteraction(payload);
            }
        });

        slackApp.event('app_mention', async ({ event }) => {
            const channelId = event.channel;
            const threadId = event.thread_ts ?? event.ts;
            const content = stringifyMessage(event);

            await agent.newMessage({
                messageId: event.ts,
                channelId,
                threadId,
                userId: assertValue(event.user),
                timestamp: new Date(+event.ts),
                content,
            });
        });

        return slackApp;
    },
});
