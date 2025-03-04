import { expect, test } from 'vitest';

import { joinLines } from '@agentscript-ai/utils';

import type { Script } from './astTypes.js';
import { parseScript } from './parseScript.js';

test('assign variable', () => {
    const code = 'const a = 1';
    const script = parseScript(code);
    const expected: Script = {
        code,
        ast: [
            {
                type: 'var',
                id: 'a',
                value: { type: 'literal', value: 1 },
            },
        ],
    };

    expect(script).toEqual(expected);
});

test('assign variable with negative value', () => {
    const code = 'const a = -1';
    const script = parseScript(code);
    const expected: Script = {
        code,
        ast: [
            {
                type: 'var',
                id: 'a',
                value: { type: 'literal', value: -1 },
            },
        ],
    };

    expect(script).toEqual(expected);
});

test('destructure object simple', () => {
    const code = 'const { a, b } = { a: 1, b: 2 };';
    const script = parseScript(code);
    const expected: Script = {
        code,
        ast: [
            {
                type: 'var',
                kind: 'object',
                id: {
                    a: {},
                    b: {},
                },
                value: {
                    type: 'literal',
                    value: { a: 1, b: 2 },
                },
            },
        ],
    };

    expect(script).toEqual(expected);
});

test('destructure object with rest', () => {
    const code = 'const { c, ...d } = { c: 3, d: 4, e: 5 };';
    const script = parseScript(code);
    const expected: Script = {
        code,
        ast: [
            {
                type: 'var',
                kind: 'object',
                id: {
                    c: {},
                    d: { rest: true },
                },
                value: {
                    type: 'literal',
                    value: { c: 3, d: 4, e: 5 },
                },
            },
        ],
    };

    expect(script).toEqual(expected);
});

test('destructure object with renaming', () => {
    const code = 'const { a: e } = { a: 1 };';
    const script = parseScript(code);
    const expected: Script = {
        code,
        ast: [
            {
                type: 'var',
                kind: 'object',
                id: { e: { value: 'a' } },
                value: { type: 'literal', value: { a: 1 } },
            },
        ],
    };

    expect(script).toEqual(expected);
});

test('destructure object with default value', () => {
    const code = 'const { f = 1 } = { f: 2 };';
    const script = parseScript(code);
    const expected: Script = {
        code,
        ast: [
            {
                type: 'var',
                kind: 'object',
                id: { f: { default: { type: 'literal', value: 1 } } },
                value: { type: 'literal', value: { f: 2 } },
            },
        ],
    };

    expect(script).toEqual(expected);
});

test('destructure object with default value and renaming', () => {
    const code = 'const { a: g = 1 } = { a: 2 };';
    const script = parseScript(code);
    const expected: Script = {
        code,
        ast: [
            {
                type: 'var',
                kind: 'object',
                id: {
                    g: {
                        value: 'a',
                        default: { type: 'literal', value: 1 },
                    },
                },
                value: { type: 'literal', value: { a: 2 } },
            },
        ],
    };

    expect(script).toEqual(expected);
});
