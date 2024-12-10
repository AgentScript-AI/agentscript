import { NotionAPILoader } from '@langchain/community/document_loaders/web/notionapi';

import { KnowledgeStore } from '@chorus/rag';
import { defineCommand } from '@nzyme/ioc';

export interface SyncNotionPageParams {
    pageId: string;
}

export const SyncNotionPage = defineCommand({
    name: 'SyncNotionPage',
    setup({ inject }) {
        const notionToken = process.env.NOTION_TOKEN;
        const knowledgeStore = inject(KnowledgeStore);

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
                await knowledgeStore.upsertDocument({
                    type: 'NOTION_PAGE',
                    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
                    title: page.metadata.properties.title as string,
                    url: page.metadata.url as string,
                    externalId: page.metadata.notionId as string,
                    updatedAt: new Date(page.metadata.last_edited_time as string),
                    document: page,
                });
            }
        };
    },
});
