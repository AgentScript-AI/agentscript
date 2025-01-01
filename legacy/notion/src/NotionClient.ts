import { Client } from '@notionhq/client';

import { EnvVariables } from '@agentscript.ai/core';
import { defineService } from '@nzyme/ioc';

export const NotionClient = defineService({
    name: 'NotionClient',
    deps: {
        env: EnvVariables,
    },
    setup({ env }) {
        return new Client({
            auth: env.NOTION_TOKEN,
        });
    },
});
