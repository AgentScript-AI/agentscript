import { expect, test } from 'vitest';

import { joinLines } from '@agentscript-ai/utils';

import type { Script } from './astTypes.js';
import { parseScript } from './parseScript.js';

test('object literal', () => {
    const code = 'const a = { b: 1 }';
    const script = parseScript(code);
    const expected: Script = {
        code,
        ast: [
            {
                type: 'var',
                id: 'a',
                value: {
                    type: 'literal',
                    value: {
                        b: 1,
                    },
                },
            },
        ],
    };

    expect(script).toEqual(expected);
});

test('object expression', () => {
    const code = joinLines([
        //
        'const a = 1',
        'const b = {',
        '  a: a',
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
                type: 'var',
                id: 'b',
                value: {
                    type: 'object',
                    props: [
                        {
                            key: { type: 'ident', name: 'a' },
                            value: { type: 'ident', name: 'a' },
                        },
                    ],
                },
            },
        ],
    };

    expect(script).toEqual(expected);
});

test('object expression with shorthand property', () => {
    const code = joinLines(['const a = 1', 'const b = { a }']);
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
                type: 'var',
                id: 'b',
                value: {
                    type: 'object',
                    props: [
                        {
                            key: { type: 'ident', name: 'a' },
                            value: { type: 'ident', name: 'a' },
                        },
                    ],
                },
            },
        ],
    };

    expect(script).toEqual(expected);
});

test('object spread', () => {
    const code = joinLines([
        //
        'const a = { b: 1, c: 2 }',
        'const d = { ...a, c: 3 }',
    ]);
    const script = parseScript(code);
    const expected: Script = {
        code,
        ast: [
            {
                type: 'var',
                id: 'a',
                value: {
                    type: 'literal',
                    value: { b: 1, c: 2 },
                },
            },
            {
                type: 'var',
                id: 'd',
                value: {
                    type: 'object',
                    props: [
                        {
                            type: 'spread',
                            value: { type: 'ident', name: 'a' },
                        },
                        {
                            key: { type: 'ident', name: 'c' },
                            value: { type: 'literal', value: 3 },
                        },
                    ],
                },
            },
        ],
    };

    expect(script).toEqual(expected);
});

test('object prop assignment', () => {
    const code = 'a.b = 2;';
    const script = parseScript(code);
    const expected: Script = {
        code,
        ast: [
            {
                type: 'assign',
                left: { type: 'member', prop: 'b', obj: { type: 'ident', name: 'a' } },
                right: { type: 'literal', value: 2 },
            },
        ],
    };

    expect(script).toEqual(expected);
});

test('object prop assignment dynamic', () => {
    const code = 'a[b] = 2;';
    const script = parseScript(code);
    const expected: Script = {
        code,
        ast: [
            {
                type: 'assign',
                left: {
                    type: 'member',
                    prop: { type: 'ident', name: 'b' },
                    obj: { type: 'ident', name: 'a' },
                },
                right: { type: 'literal', value: 2 },
            },
        ],
    };

    expect(script).toEqual(expected);
});

test('optional property access', () => {
    const code = 'a?.b';
    const script = parseScript(code);
    const expected: Script = {
        code,
        ast: [
            {
                type: 'member',
                prop: 'b',
                obj: { type: 'ident', name: 'a' },
                optional: true,
            },
        ],
    };

    expect(script).toEqual(expected);
});
