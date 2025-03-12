import { imports } from '@nzyme/eslint';

export function common() {
    return imports({
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
    });
}
