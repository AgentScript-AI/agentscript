import { and, eq } from 'drizzle-orm';

import { TenantContext } from '@agentscript.ai/core';
import { DatabaseClient, db } from '@agentscript.ai/database';
import { KnowledgeStore } from '@agentscript.ai/rag';
import { defineCommand } from '@nzyme/ioc';
import { findAndRemove } from '@nzyme/utils';

import { NotionClient } from './NotionClient.js';
import { SyncNotionPage } from './SyncNotionPage.js';

export const SyncNotionPages = defineCommand({
    name: 'SyncNotionPages',
    setup({ inject }) {
        const notionClient = inject(NotionClient);
        const database = inject(DatabaseClient);
        const tenantContext = inject(TenantContext);
        const syncNotionPage = inject(SyncNotionPage);
        const knowledgeStore = inject(KnowledgeStore);

        return async () => {
            const [pagesInNotion, pagesInDatabase] = await Promise.all([
                loadNotionPages(),
                loadPagesInDatabase(),
            ]);

            for (const pageInNotion of pagesInNotion) {
                const pageInDatabase = findAndRemove(
                    pagesInDatabase,
                    p => p.externalId === pageInNotion.id,
                );
                if (!pageInDatabase || pageInDatabase.syncedAt < pageInNotion.updatedAt) {
                    await syncNotionPage({ pageId: pageInNotion.id });
                }
            }

            for (const pageInDatabase of pagesInDatabase) {
                await knowledgeStore.deleteDocument({
                    type: 'NOTION_PAGE',
                    externalId: pageInDatabase.externalId,
                });
            }
        };

        async function loadNotionPages() {
            type PageResult = {
                id: string;
                updatedAt: Date;
            };
            const pageIds: PageResult[] = [];

            let result: Awaited<ReturnType<typeof notionClient.search>> | undefined;

            do {
                result = await notionClient.search({
                    start_cursor: result?.next_cursor ?? undefined,
                    filter: {
                        property: 'object',
                        value: 'page',
                    },
                });

                for (const page of result.results) {
                    if (page.object !== 'page' || !('last_edited_time' in page)) {
                        continue;
                    }

                    pageIds.push({
                        id: page.id,
                        updatedAt: new Date(page.last_edited_time),
                    });
                }
            } while (result.has_more);

            return pageIds;
        }

        async function loadPagesInDatabase() {
            const pages = await database.query.knowledge.findMany({
                where: and(
                    eq(db.knowledge.tenantId, tenantContext.tenantId),
                    eq(db.knowledge.type, 'NOTION_PAGE'),
                    eq(db.knowledge.chunk, 0),
                ),
                columns: {
                    id: true,
                    externalId: true,
                    syncedAt: true,
                },
            });

            return pages;
        }
    },
});
