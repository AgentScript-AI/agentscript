import { and, cosineDistance, desc, eq, gte, sql } from 'drizzle-orm';

import { Logger, TenantContext } from '@agentscript/core';
import { DatabaseClient, db } from '@agentscript/database';
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
        const logger = inject(Logger);

        return async (params: KnowledgeRetrieverParams) => {
            logger.debug('Querying "%s"', params.query, params);

            const queryVector = await embeddingModel.embedQuery(params.query);
            const similarity = sql<number>`1 - (${cosineDistance(db.knowledge.vector, queryVector)})`;

            const results = await databaseClient
                .select({
                    id: db.knowledge.id,
                    type: db.knowledge.type,
                    title: db.knowledge.title,
                    externalId: db.knowledge.externalId,
                    url: db.knowledge.url,
                    metadata: db.knowledge.metadata,
                    content: db.knowledge.content,
                    similarity,
                })
                .from(db.knowledge)
                .where(and(eq(db.knowledge.tenantId, tenantContext.tenantId), gte(similarity, 0.3)))
                .orderBy(desc(similarity))
                .limit(params.limit ?? 10);

            return results;
        };
    },
});
