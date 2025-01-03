import * as s from '@agentscript.ai/schema';

interface IssueFilterOptions {
    statuses: string[];
}

/**
 * Create a filter for issues.
 * @param options - The options for the filter.
 * @returns The filter.
 */
export function createIssueFilter(options: IssueFilterOptions) {
    return s.object({
        props: {
            status: s.array({
                of: s.enum(options.statuses),
                optional: true,
                description: 'Filter issues by status.',
            }),
            createdAt: s.extend(DateComparator, {
                optional: true,
                description: 'Filter issues by creation date.',
            }),
            updatedAt: s.extend(DateComparator, {
                optional: true,
                description: 'Filter issues by last updated date.',
            }),
        },
    });
}

const DateComparator = s.object({
    props: {
        gt: s.string({
            optional: true,
            description: 'Greater than',
        }),
        gte: s.string({
            optional: true,
            description: 'Greater than or equal to',
        }),
        lt: s.string({
            optional: true,
            description: 'Less than',
        }),
        lte: s.string({
            optional: true,
            description: 'Less than or equal to',
        }),
    },
});
