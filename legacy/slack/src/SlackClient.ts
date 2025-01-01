import { WebClient } from '@slack/web-api';

import { defineService } from '@nzyme/ioc';

export type SlackClient = WebClient;
export const SlackClient = defineService<SlackClient>({
    name: 'SlackClient',
    setup() {
        const token = process.env.SLACK_BOT_TOKEN;
        const client = new WebClient(token);

        return client;
    },
});
