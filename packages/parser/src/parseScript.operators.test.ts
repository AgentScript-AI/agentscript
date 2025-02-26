import { expect, test } from 'vitest';

import type { Script } from './astTypes.js';
import { parseScript } from './parseScript.js';

test('add operator', () => {
    const code = 'const a = 1 + 2';
    const script = parseScript(code);
    const expected: Script = {
        code,
        ast: [
            {
                type: 'var',
                name: 'a',
                value: {
                    type: 'binary',
                    operator: '+',
                    left: { type: 'literal', value: 1 },
                    right: { type: 'literal', value: 2 },
                },
            },
        ],
    };

    expect(script).toEqual(expected);
});

test('multiply operator', () => {
    const code = 'const a = 1 * 2';
    const script = parseScript(code);
    const expected: Script = {
        code,
        ast: [
            {
                type: 'var',
                name: 'a',
                value: {
                    type: 'binary',
                    operator: '*',
                    left: { type: 'literal', value: 1 },
                    right: { type: 'literal', value: 2 },
                },
            },
        ],
    };

    expect(script).toEqual(expected);
});

test('subtract operator', () => {
    const code = 'const a = 1 - 2';
    const script = parseScript(code);
    const expected: Script = {
        code,
        ast: [
            {
                type: 'var',
                name: 'a',
                value: {
                    type: 'binary',
                    operator: '-',
                    left: { type: 'literal', value: 1 },
                    right: { type: 'literal', value: 2 },
                },
            },
        ],
    };

    expect(script).toEqual(expected);
});

test('divide operator', () => {
    const code = 'const a = 1 / 2';
    const script = parseScript(code);
    const expected: Script = {
        code,
        ast: [
            {
                type: 'var',
                name: 'a',
                value: {
                    type: 'binary',
                    operator: '/',
                    left: { type: 'literal', value: 1 },
                    right: { type: 'literal', value: 2 },
                },
            },
        ],
    };

    expect(script).toEqual(expected);
});

test('modulo operator', () => {
    const code = 'const a = 1 % 2';
    const script = parseScript(code);
    const expected: Script = {
        code,
        ast: [
            {
                type: 'var',
                name: 'a',
                value: {
                    type: 'binary',
                    operator: '%',
                    left: { type: 'literal', value: 1 },
                    right: { type: 'literal', value: 2 },
                },
            },
        ],
    };

    expect(script).toEqual(expected);
});

test('equal operator', () => {
    const code = 'const a = 1 == 2';
    const script = parseScript(code);
    const expected: Script = {
        code,
        ast: [
            {
                type: 'var',
                name: 'a',
                value: {
                    type: 'binary',
                    operator: '==',
                    left: { type: 'literal', value: 1 },
                    right: { type: 'literal', value: 2 },
                },
            },
        ],
    };

    expect(script).toEqual(expected);
});

test('strict equal operator', () => {
    const code = 'const a = 1 === 2';
    const script = parseScript(code);
    const expected: Script = {
        code,
        ast: [
            {
                type: 'var',
                name: 'a',
                value: {
                    type: 'binary',
                    operator: '===',
                    left: { type: 'literal', value: 1 },
                    right: { type: 'literal', value: 2 },
                },
            },
        ],
    };

    expect(script).toEqual(expected);
});

test('not equal operator', () => {
    const code = 'const a = 1 != 2';
    const script = parseScript(code);
    const expected: Script = {
        code,
        ast: [
            {
                type: 'var',
                name: 'a',
                value: {
                    type: 'binary',
                    operator: '!=',
                    left: { type: 'literal', value: 1 },
                    right: { type: 'literal', value: 2 },
                },
            },
        ],
    };

    expect(script).toEqual(expected);
});

test('strict not equal operator', () => {
    const code = 'const a = 1 !== 2';
    const script = parseScript(code);
    const expected: Script = {
        code,
        ast: [
            {
                type: 'var',
                name: 'a',
                value: {
                    type: 'binary',
                    operator: '!==',
                    left: { type: 'literal', value: 1 },
                    right: { type: 'literal', value: 2 },
                },
            },
        ],
    };

    expect(script).toEqual(expected);
});

test('greater than operator', () => {
    const code = 'const a = 1 > 2';
    const script = parseScript(code);
    const expected: Script = {
        code,
        ast: [
            {
                type: 'var',
                name: 'a',
                value: {
                    type: 'binary',
                    operator: '>',
                    left: { type: 'literal', value: 1 },
                    right: { type: 'literal', value: 2 },
                },
            },
        ],
    };

    expect(script).toEqual(expected);
});

test('less than operator', () => {
    const code = 'const a = 1 < 2';
    const script = parseScript(code);
    const expected: Script = {
        code,
        ast: [
            {
                type: 'var',
                name: 'a',
                value: {
                    type: 'binary',
                    operator: '<',
                    left: { type: 'literal', value: 1 },
                    right: { type: 'literal', value: 2 },
                },
            },
        ],
    };

    expect(script).toEqual(expected);
});

test('greater than or equal operator', () => {
    const code = 'const a = 1 >= 2';
    const script = parseScript(code);
    const expected: Script = {
        code,
        ast: [
            {
                type: 'var',
                name: 'a',
                value: {
                    type: 'binary',
                    operator: '>=',
                    left: { type: 'literal', value: 1 },
                    right: { type: 'literal', value: 2 },
                },
            },
        ],
    };

    expect(script).toEqual(expected);
});

test('less than or equal operator', () => {
    const code = 'const a = 1 <= 2';
    const script = parseScript(code);
    const expected: Script = {
        code,
        ast: [
            {
                type: 'var',
                name: 'a',
                value: {
                    type: 'binary',
                    operator: '<=',
                    left: { type: 'literal', value: 1 },
                    right: { type: 'literal', value: 2 },
                },
            },
        ],
    };

    expect(script).toEqual(expected);
});

test('logical AND operator', () => {
    const code = 'const a = 1 && 2';
    const script = parseScript(code);
    const expected: Script = {
        code,
        ast: [
            {
                type: 'var',
                name: 'a',
                value: {
                    type: 'logical',
                    operator: '&&',
                    left: { type: 'literal', value: 1 },
                    right: { type: 'literal', value: 2 },
                },
            },
        ],
    };

    expect(script).toEqual(expected);
});

test('logical OR operator', () => {
    const code = 'const a = 1 || 2';
    const script = parseScript(code);
    const expected: Script = {
        code,
        ast: [
            {
                type: 'var',
                name: 'a',
                value: {
                    type: 'logical',
                    operator: '||',
                    left: { type: 'literal', value: 1 },
                    right: { type: 'literal', value: 2 },
                },
            },
        ],
    };

    expect(script).toEqual(expected);
});

test('nullish coalescing operator', () => {
    const code = 'const a = 1 ?? 2';
    const script = parseScript(code);
    const expected: Script = {
        code,
        ast: [
            {
                type: 'var',
                name: 'a',
                value: {
                    type: 'logical',
                    operator: '??',
                    left: { type: 'literal', value: 1 },
                    right: { type: 'literal', value: 2 },
                },
            },
        ],
    };

    expect(script).toEqual(expected);
});

test('post increment operator', () => {
    const code = 'a++;';
    const script = parseScript(code);
    const expected: Script = {
        code,
        ast: [
            {
                type: 'update',
                operator: '++',
                expr: { type: 'ident', name: 'a' },
                pre: false,
            },
        ],
    };

    expect(script).toEqual(expected);
});

test('pre increment operator', () => {
    const code = '++a;';
    const script = parseScript(code);
    const expected: Script = {
        code,
        ast: [
            {
                type: 'update',
                operator: '++',
                expr: { type: 'ident', name: 'a' },
                pre: true,
            },
        ],
    };

    expect(script).toEqual(expected);
});

test('post decrement operator', () => {
    const code = 'a--;';
    const script = parseScript(code);
    const expected: Script = {
        code,
        ast: [
            {
                type: 'update',
                operator: '--',
                expr: { type: 'ident', name: 'a' },
                pre: false,
            },
        ],
    };

    expect(script).toEqual(expected);
});

test('pre decrement operator', () => {
    const code = '--a;';
    const script = parseScript(code);
    const expected: Script = {
        code,
        ast: [
            {
                type: 'update',
                operator: '--',
                expr: { type: 'ident', name: 'a' },
                pre: true,
            },
        ],
    };

    expect(script).toEqual(expected);
});

test('negate operator', () => {
    const code = 'const a = -b;';
    const script = parseScript(code);
    const expected: Script = {
        code,
        ast: [
            {
                type: 'var',
                name: 'a',
                value: {
                    type: 'unary',
                    operator: '-',
                    expr: { type: 'ident', name: 'b' },
                },
            },
        ],
    };

    expect(script).toEqual(expected);
});

test('plus operator', () => {
    const code = 'const a = +b;';
    const script = parseScript(code);
    const expected: Script = {
        code,
        ast: [
            {
                type: 'var',
                name: 'a',
                value: {
                    type: 'unary',
                    operator: '+',
                    expr: { type: 'ident', name: 'b' },
                },
            },
        ],
    };

    expect(script).toEqual(expected);
});

test('typeof operator', () => {
    const code = 'const a = typeof b;';
    const script = parseScript(code);
    const expected: Script = {
        code,
        ast: [
            {
                type: 'var',
                name: 'a',
                value: {
                    type: 'unary',
                    operator: 'typeof',
                    expr: { type: 'ident', name: 'b' },
                },
            },
        ],
    };

    expect(script).toEqual(expected);
});

test('not operator', () => {
    const code = 'const a = !b;';
    const script = parseScript(code);
    const expected: Script = {
        code,
        ast: [
            {
                type: 'var',
                name: 'a',
                value: {
                    type: 'unary',
                    operator: '!',
                    expr: { type: 'ident', name: 'b' },
                },
            },
        ],
    };

    expect(script).toEqual(expected);
});
