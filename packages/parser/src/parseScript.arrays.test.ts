import { expect, test } from 'vitest';

import { joinLines } from '@agentscript-ai/utils';

import type { Script } from './astTypes.js';
import { parseScript } from './parseScript.js';

test('array literal', () => {
    const code = 'const a = [1, 2, 3]';
    const script = parseScript(code);
    const expected: Script = {
        code,
        ast: [
            {
                type: 'var',
                name: 'a',
                value: {
                    type: 'literal',
                    value: [1, 2, 3],
                },
            },
        ],
    };

    expect(script).toEqual(expected);
});

test('array expression', () => {
    const code = joinLines([
        //
        'const a = 1',
        'const b = [a, 2, 3]',
    ]);
    const script = parseScript(code);
    const expected: Script = {
        code,
        ast: [
            {
                type: 'var',
                name: 'a',
                value: { type: 'literal', value: 1 },
            },
            {
                type: 'var',
                name: 'b',
                value: {
                    type: 'array',
                    items: [
                        { type: 'ident', name: 'a' },
                        { type: 'literal', value: 2 },
                        { type: 'literal', value: 3 },
                    ],
                },
            },
        ],
    };

    expect(script).toEqual(expected);
});

test('array map inline', () => {
    const code = joinLines([
        //
        'const a = [1, 2, 3]',
        'const b = a.map(x => x * 2)',
    ]);

    const script = parseScript(code);

    const expected: Script = {
        code,
        ast: [
            {
                type: 'var',
                name: 'a',
                value: {
                    type: 'literal',
                    value: [1, 2, 3],
                },
            },
            {
                type: 'var',
                name: 'b',
                value: {
                    type: 'call',
                    func: {
                        type: 'member',
                        obj: { type: 'ident', name: 'a' },
                        prop: 'map',
                    },
                    args: [
                        {
                            type: 'arrowfn',
                            params: [{ type: 'ident', name: 'x' }],
                            body: {
                                type: 'binary',
                                operator: '*',
                                left: { type: 'ident', name: 'x' },
                                right: { type: 'literal', value: 2 },
                            },
                        },
                    ],
                },
            },
        ],
    };

    expect(script).toEqual(expected);
});

test('array map with function', () => {
    const code = joinLines([
        //
        'const a = [1, 2, 3]',
        'const b = a.map(x => {',
        '    // multiply x by 2',
        '    return x * 2',
        '})',
    ]);

    const script = parseScript(code);

    const expected: Script = {
        code,
        ast: [
            {
                type: 'var',
                name: 'a',
                value: {
                    type: 'literal',
                    value: [1, 2, 3],
                },
            },
            {
                type: 'var',
                name: 'b',
                value: {
                    type: 'call',
                    func: {
                        type: 'member',
                        obj: { type: 'ident', name: 'a' },
                        prop: 'map',
                    },
                    args: [
                        {
                            type: 'arrowfn',
                            params: [{ type: 'ident', name: 'x' }],
                            body: {
                                type: 'block',
                                body: [
                                    {
                                        type: 'return',
                                        comment: 'multiply x by 2',
                                        value: {
                                            type: 'binary',
                                            operator: '*',
                                            left: { type: 'ident', name: 'x' },
                                            right: { type: 'literal', value: 2 },
                                        },
                                    },
                                ],
                            },
                        },
                    ],
                },
            },
        ],
    };

    expect(script).toEqual(expected);
});

test('array spread', () => {
    const code = 'const a = [1, 2, 3]; const b = [...a, 4, 5, 6];';
    const script = parseScript(code);
    const expected: Script = {
        code,
        ast: [
            {
                type: 'var',
                name: 'a',
                value: { type: 'literal', value: [1, 2, 3] },
            },
            {
                type: 'var',
                name: 'b',
                value: {
                    type: 'array',
                    items: [
                        { type: 'spread', value: { type: 'ident', name: 'a' } },
                        { type: 'literal', value: 4 },
                        { type: 'literal', value: 5 },
                        { type: 'literal', value: 6 },
                    ],
                },
            },
        ],
    };

    expect(script).toEqual(expected);
});
