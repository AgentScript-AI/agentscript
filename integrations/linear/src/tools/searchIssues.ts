import createDebug from 'debug';

import { LanguageModel, defineTool, inferResult } from '@agentscript.ai/core';
import * as s from '@agentscript.ai/schema';
import { defineService } from '@nzyme/ioc';

import { LinearClient } from '../LinearClient.js';
import type { GetIssuesQuery, GetIssuesQueryVariables, GetWorkflowStatesQuery } from '../gql.js';
import { GetIssuesDocument, GetWorkflowStatesDocument } from '../gql.js';
import { Issue } from '../types/Issue.js';
import { createIssueFilter } from '../types/IssueFilter.js';

const SearchIssuesQuery = s.object({
    props: {
        query: s.unknown({
            description: 'Descriptive query in object format.',
        }),
    },
});

const debug = createDebug('agentscript:linear:searchIssues');

/**
 * Search Linear tasks tool.
 */
export const searchIssues = defineService({
    name: 'LinearSearchIssues',
    deps: {
        llm: LanguageModel,
        linear: LinearClient,
    },
    setup({ llm, linear }) {
        return defineTool({
            description: [
                'Search for issues using a natural language query.',
                'Do not filter results later, put all the search criteria in the query.',
            ],
            args: SearchIssuesQuery.props,
            return: s.array(Issue),
            types: {
                Issue,
            },
            async handler({ args: { query } }) {
                const workflowStates = await loadWorkflowStates();
                const issueFilterSchema = createIssueFilter({
                    statuses: workflowStates,
                });

                const issuesFilter = await inferResult({
                    llm,
                    systemPrompt: `Create a filter for issues based on the given query.`,
                    prompt: JSON.stringify(query),
                    result: issueFilterSchema,
                });

                debug('issuesFilter', issuesFilter);

                const issuesVariables: GetIssuesQueryVariables = {
                    comments: false,
                    description: true,
                    filter: {
                        createdAt: issuesFilter.createdAt,
                        updatedAt: issuesFilter.updatedAt,
                        state: issuesFilter.status
                            ? {
                                  name: {
                                      in: issuesFilter.status,
                                  },
                              }
                            : undefined,
                    },
                };

                const issuesResult = await linear.request<GetIssuesQuery>(
                    GetIssuesDocument,
                    issuesVariables,
                );

                debug('issuesResult', issuesResult);

                const issues = issuesResult.issues.nodes.map<Issue>(issue => ({
                    id: issue.identifier,
                    url: issue.url,
                    title: issue.title,
                    description: issue.description ?? undefined,
                    status: issue.state.name,
                    createdAt: new Date(String(issue.createdAt)),
                    updatedAt: new Date(String(issue.updatedAt)),
                }));

                return issues;
            },
        });

        async function loadWorkflowStates() {
            const result = await linear.request<GetWorkflowStatesQuery>(GetWorkflowStatesDocument);
            return result.workflowStates.nodes.map(state => state.name);
        }
    },
});
