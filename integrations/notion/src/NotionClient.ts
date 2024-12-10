import { Client } from '@notionhq/client';

import { defineService } from '@nzyme/ioc';

export const NotionClient = defineService({
    name: 'NotionClient',
    setup() {
        return new Client({
            auth: process.env.NOTION_TOKEN,
        });
    },
});
