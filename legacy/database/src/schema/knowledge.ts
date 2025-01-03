import {
    bigint,
    bigserial,
    index,
    integer,
    jsonb,
    pgEnum,
    pgTable,
    text,
    timestamp,
    uniqueIndex,
    vector,
} from 'drizzle-orm/pg-core';

import { KnowledgeType } from '@agentscript-ai/core';

export const knowledgeType = pgEnum('knowledge_type', KnowledgeType);

export const knowledge = pgTable(
    'knowledge',
    {
        id: bigserial('id', { mode: 'bigint' }).primaryKey(),
        type: knowledgeType('type').notNull(),
        tenantId: bigint('tenant_id', { mode: 'bigint' }).notNull(),
        externalId: text('external_id').notNull(),
        chunk: integer('chunk').notNull(),
        title: text('title'),
        url: text('url').notNull(),
        content: text('content').notNull(),
        vector: vector('vector', { dimensions: 1536 }),
        metadata: jsonb('metadata'),
        updatedAt: timestamp('updated_at').notNull(),
        syncedAt: timestamp('synced_at').notNull(),
    },
    table => [
        uniqueIndex('externalIdIndex').on(
            table.tenantId,
            table.type,
            table.externalId,
            table.chunk,
        ),
        index('vectorIndex').using('hnsw', table.vector.op('vector_cosine_ops')),
    ],
);
