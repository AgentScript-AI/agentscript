import { imports } from '@nzyme/eslint';
import { globalIgnores } from 'eslint/config';

export function common() {
    return [
        ...imports({
            groups: [
                {
                    pattern: 'agentscript-ai',
                    group: 'internal',
                },
                {
                    pattern: 'agentscript-ai/**',
                    group: 'internal',
                },
                {
                    pattern: '@agentscript-ai/**',
                    group: 'internal',
                },
                {
                    pattern: '@/**',
                    group: 'internal',
                    position: 'after',
                },
            ],
        }),
        globalIgnores(['dist/**/*', 'dist-*/**/*', 'node_modules/**/*']),
    ];
}
