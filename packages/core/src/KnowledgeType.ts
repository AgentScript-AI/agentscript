import { defineEnum } from '@nzyme/utils';

export const KnowledgeType = defineEnum(['NOTION_PAGE', 'GOOGLE_DOCS', 'WEBSITE']);
export type KnowledgeType = (typeof KnowledgeType)[number];
