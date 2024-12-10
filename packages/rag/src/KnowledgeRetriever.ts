import { Document } from '@langchain/core/documents';
import { and, cosineDistance, desc, eq, gte, sql } from 'drizzle-orm';

import { TenantContext } from '@chorus/core';
import { DatabaseClient, db } from '@chorus/database';
import { defineService } from '@nzyme/ioc';

import { EmbeddingModel } from './EmbeddingModel.js';

export interface KnowledgeRetrieverParams {
    query: string;
    limit?: number;
}

export const KnowledgeRetriever = defineService({
    name: 'KnowledgeRetriever',
    setup({ inject }) {
        const databaseClient = inject(DatabaseClient);
        const tenantContext = inject(TenantContext);
        const embeddingModel = inject(EmbeddingModel);

        return async (params: KnowledgeRetrieverParams) => {
            const queryVector = await embeddingModel.embedQuery(params.query);
            const similarity = sql<number>`1 - (${cosineDistance(db.knowledge.vector, queryVector)})`;

            const pages = await databaseClient
                .select({
                    id: db.knowledge.id,
                    type: db.knowledge.type,
                    title: db.knowledge.title,
                    externalId: db.knowledge.externalId,
                    url: db.knowledge.url,
                    metadata: db.knowledge.metadata,
                    content: db.knowledge.content,
                })
                .from(db.knowledge)
                .where(and(eq(db.knowledge.tenantId, tenantContext.tenantId), gte(similarity, 0.5)))
                .orderBy(desc(similarity))
                .limit(params.limit ?? 10);

            const documents = pages.map(
                page =>
                    new Document({
                        pageContent: page.content,
                        metadata: page.metadata as Record<string, unknown>,
                        id: `${page.type}:${page.externalId}`,
                    }),
            );

            return documents;
        };
    },
});
