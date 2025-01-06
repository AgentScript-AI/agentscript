import * as s from '@agentscript-ai/schema';

/**
 * Issue type.
 */
export type Issue = s.Infer<typeof Issue>;

/**
 * Issue schema.
 */
export const Issue = s.object({
    props: {
        id: s.string(),
        url: s.string(),
        title: s.string(),
        description: s.string({ optional: true }),
        status: s.string(),
        createdAt: s.date(),
        updatedAt: s.date(),
    },
});
