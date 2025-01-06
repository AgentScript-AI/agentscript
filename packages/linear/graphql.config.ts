import type { CodegenConfig } from '@graphql-codegen/cli';

const config: CodegenConfig = {
    schema: 'https://api.linear.app/graphql',
    documents: ['src/**/*.gql'],
    overwrite: true,
    generates: {
        './src/gql.ts': {
            plugins: ['typescript', 'typescript-operations', 'typescript-graphql-request'],
            config: {
                useTypeImports: true,
                enumsAsConst: true,
                // allows to dump the whole GraphQL parsing library (50KB!)
                documentMode: 'string',
            },
        },
    },
};

export default config;
