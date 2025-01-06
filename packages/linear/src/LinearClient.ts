import { GraphQLClient } from 'graphql-request';

import { defineService, envVariable } from '@nzyme/ioc';

/**
 * Linear client.
 */
export type LinearClient = GraphQLClient;

/**
 * Linear client service.
 */
export const LinearClient = defineService({
    name: 'LinearClient',
    deps: {
        apiKey: envVariable('LINEAR_API_KEY'),
    },
    setup({ apiKey }) {
        return new GraphQLClient('https://api.linear.app/graphql', {
            headers: {
                Authorization: apiKey,
            },
        });
    },
});
