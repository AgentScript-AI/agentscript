import { expect, test } from 'vitest';

import { joinLines } from '@agentscript-ai/utils';

import type { Script } from './astTypes.js';
import { parseScript } from './parseScript.js';

test('increment variable in while loop', () => {
    const code = joinLines([
        //
        'const a = 1;',
        'while (a < 3) {',
        '    a++;',
        '}',
    ]);

    const script = parseScript(code);
    const expected: Script = {
        code,
        ast: [
            {
                type: 'var',
                id: 'a',
                value: { type: 'literal', value: 1 },
            },
            {
                type: 'while',
                if: {
                    type: 'binary',
                    operator: '<',
                    left: { type: 'ident', name: 'a' },
                    right: { type: 'literal', value: 3 },
                },
                body: {
                    type: 'block',
                    body: [
                        {
                            type: 'update',
                            operator: '++',
                            expr: { type: 'ident', name: 'a' },
                            pre: false,
                        },
                    ],
                },
            },
        ],
    };

    expect(script).toEqual(expected);
});

test('while loop, increment variable, with break', () => {
    const code = joinLines([
        //
        'let a = 1',
        'while (true) {',
        '    if (++a > 2) {',
        '        break;',
        '    }',
        '}',
    ]);

    const script = parseScript(code);
    const expected: Script = {
        code,
        ast: [
            {
                type: 'var',
                id: 'a',
                value: { type: 'literal', value: 1 },
            },
            {
                type: 'while',
                if: { type: 'literal', value: true },
                body: {
                    type: 'block',
                    body: [
                        {
                            type: 'if',
                            if: {
                                type: 'binary',
                                operator: '>',
                                left: {
                                    type: 'update',
                                    operator: '++',
                                    expr: { type: 'ident', name: 'a' },
                                    pre: true,
                                },
                                right: { type: 'literal', value: 2 },
                            },
                            then: {
                                type: 'block',
                                body: [{ type: 'break' }],
                            },
                        },
                    ],
                },
            },
        ],
    };

    expect(script).toEqual(expected);
});
