module.exports = {
    rules: {
        'sort-imports': [
            'warn',
            {
                ignoreCase: false,
                ignoreDeclarationSort: true,
                ignoreMemberSort: false,
                allowSeparatedGroups: true,
            },
        ],
        'import/order': [
            'warn',
            {
                'newlines-between': 'always',
                groups: ['builtin', 'external', 'internal', ['parent', 'sibling'], 'index'],
                // https://github.com/benmosher/eslint-plugin-import/blob/master/docs/rules/order.md#pathgroups-array-of-objects
                pathGroups: [
                    {
                        pattern: '@nzyme/**',
                        group: 'internal',
                    },
                    {
                        pattern: '@agentscript.ai/**',
                        group: 'internal',
                    },
                    {
                        pattern: '@/**',
                        group: 'internal',
                        position: 'after',
                    },
                    {
                        pattern: '~/**',
                        group: 'internal',
                        position: 'after',
                    },
                ],
                pathGroupsExcludedImportTypes: ['builtin'],
                alphabetize: {
                    order: 'asc',
                },
            },
        ],
    },
};
