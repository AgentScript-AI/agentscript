import type { Document } from '@langchain/core/documents';
import { RecursiveCharacterTextSplitter } from '@langchain/textsplitters';
import { and, eq, gte } from 'drizzle-orm';

import type { KnowledgeType } from '@chorus/core';
import { TenantContext } from '@chorus/core';
import { DatabaseClient, db } from '@chorus/database';
import { defineService } from '@nzyme/ioc';

import { EmbeddingModel } from './EmbeddingModel.js';

export interface KnowledgeStoreDocumentParams {
    type: KnowledgeType;
    externalId: string;
}

export interface KnowledgeStoreDocumentUpsertParams extends KnowledgeStoreDocumentParams {
    document: Document;
    title?: string;
    url: string;
    updatedAt: Date;
}

export const KnowledgeStore = defineService({
    name: 'KnowledgeStore',
    setup({ inject }) {
        const embeddingModel = inject(EmbeddingModel);
        const databaseClient = inject(DatabaseClient);
        const tenantContext = inject(TenantContext);

        const splitter = RecursiveCharacterTextSplitter.fromLanguage('markdown', {
            chunkSize: 1000,
            chunkOverlap: 200,
        });

        return {
            upsertDocument,
            deleteDocument,
        };

        async function upsertDocument(document: KnowledgeStoreDocumentUpsertParams) {
            const chunks = await splitter.splitDocuments([document.document]);
            const vectors = await embeddingModel.embedDocuments(
                chunks.map(c => `# ${document.title}\n\n${c.pageContent}`),
            );
            const syncedAt = new Date();
            const updatedAt = document.updatedAt;

            for (let i = 0; i < chunks.length; i++) {
                const chunk = chunks[i];

                await databaseClient
                    .insert(db.knowledge)
                    .values({
                        type: document.type,
                        tenantId: tenantContext.tenantId,
                        chunk: i,
                        content: chunk.pageContent,
                        title: document.title,
                        url: document.url,
                        externalId: document.externalId,
                        vector: vectors[i],
                        metadata: chunk.metadata,
                        syncedAt,
                        updatedAt,
                    })
                    .onConflictDoUpdate({
                        target: [
                            db.knowledge.tenantId,
                            db.knowledge.type,
                            db.knowledge.externalId,
                            db.knowledge.chunk,
                        ],
                        set: {
                            title: document.title,
                            url: document.url,
                            vector: vectors[i],
                            metadata: chunk.metadata,
                            syncedAt,
                            updatedAt,
                        },
                    });
            }

            await databaseClient
                .delete(db.knowledge)
                .where(
                    and(
                        eq(db.knowledge.tenantId, tenantContext.tenantId),
                        eq(db.knowledge.type, document.type),
                        eq(db.knowledge.externalId, document.externalId),
                        gte(db.knowledge.chunk, chunks.length),
                    ),
                );
        }

        async function deleteDocument(document: KnowledgeStoreDocumentParams) {
            await databaseClient
                .delete(db.knowledge)
                .where(
                    and(
                        eq(db.knowledge.tenantId, tenantContext.tenantId),
                        eq(db.knowledge.type, 'NOTION_PAGE'),
                        eq(db.knowledge.externalId, document.externalId),
                    ),
                );
        }
    },
});
