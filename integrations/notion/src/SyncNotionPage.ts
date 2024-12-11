import { NotionAPILoader } from '@langchain/community/document_loaders/web/notionapi';

import { EnvVariables, Logger } from '@chorus/core';
import { KnowledgeStore } from '@chorus/rag';
import { defineCommand } from '@nzyme/ioc';

export interface SyncNotionPageParams {
    pageId: string;
}

export const SyncNotionPage = defineCommand({
    name: 'SyncNotionPage',
    setup({ inject }) {
        const notionToken = inject(EnvVariables).NOTION_TOKEN;
        const knowledgeStore = inject(KnowledgeStore);
        const logger = inject(Logger);

        return async (params: SyncNotionPageParams) => {
            // Loading a page (including child pages all as separate documents)
            const pageLoader = new NotionAPILoader({
                clientOptions: {
                    auth: notionToken,
                },
                id: params.pageId,
                propertiesAsHeader: true,
                callerOptions: {},
                type: 'page',
            });

            const pages = await pageLoader.load();

            for (const page of pages) {
                const properties = page.metadata.properties as Record<string, string | undefined>;
                const title = properties.title || properties._title || properties.Page;

                logger.info('Syncing Notion page "%s"', title, {
                    title,
                    url: page.metadata.url as string,
                    externalId: page.metadata.notionId as string,
                    updatedAt: new Date(page.metadata.last_edited_time as string),
                });

                await knowledgeStore.upsertDocument({
                    type: 'NOTION_PAGE',
                    title,
                    url: page.metadata.url as string,
                    externalId: page.metadata.notionId as string,
                    updatedAt: new Date(page.metadata.last_edited_time as string),
                    document: page,
                });
            }
        };
    },
});
