import { Client } from '@notionhq/client';

import { EnvVariables } from '@agentscript/core';
import { defineService } from '@nzyme/ioc';

export const NotionClient = defineService({
    name: 'NotionClient',
    setup({ inject }) {
        const env = inject(EnvVariables);

        return new Client({
            auth: env.NOTION_TOKEN,
        });
    },
});
