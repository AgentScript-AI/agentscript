import { expect, test } from 'vitest';

import type { Script } from './astTypes.js';
import { parseScript } from './parseScript.js';

test('assign variable', () => {
    const code = 'const a = 1';
    const script = parseScript(code);
    const expected: Script = {
        code,
        ast: [
            {
                type: 'Variable',
                name: 'a',
                value: { type: 'Literal', value: 1 },
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
                type: 'Variable',
                name: 'a',
                value: { type: 'Literal', value: -1 },
            },
        ],
    };

    expect(script).toEqual(expected);
});

test('call function', () => {
    const code = 'foo()';
    const script = parseScript(code);
    const expected: Script = {
        code,
        ast: [
            {
                type: 'Expression',
                expr: {
                    type: 'FunctionCall',
                    func: { type: 'Identifier', name: 'foo' },
                    args: [],
                },
            },
        ],
    };

    expect(script).toEqual(expected);
});

test('call function with arguments', () => {
    const code = 'foo(1, 2, 3)';
    const script = parseScript(code);
    const expected: Script = {
        code,
        ast: [
            {
                type: 'Expression',
                expr: {
                    type: 'FunctionCall',
                    func: { type: 'Identifier', name: 'foo' },
                    args: [
                        { type: 'Literal', value: 1 },
                        { type: 'Literal', value: 2 },
                        { type: 'Literal', value: 3 },
                    ],
                },
            },
        ],
    };

    expect(script).toEqual(expected);
});

test('call function and assign to variable', () => {
    const code = 'const a = foo(1, 2, 3)';
    const script = parseScript(code);
    const expected: Script = {
        code,
        ast: [
            {
                type: 'Variable',
                name: 'a',
                value: {
                    type: 'FunctionCall',
                    func: { type: 'Identifier', name: 'foo' },
                    args: [
                        { type: 'Literal', value: 1 },
                        { type: 'Literal', value: 2 },
                        { type: 'Literal', value: 3 },
                    ],
                },
            },
        ],
    };

    expect(script).toEqual(expected);
});

test('call member function', () => {
    const code = 'foo.bar()';
    const script = parseScript(code);
    const expected: Script = {
        code,
        ast: [
            {
                type: 'Expression',
                expr: {
                    type: 'FunctionCall',
                    func: {
                        type: 'Member',
                        obj: { type: 'Identifier', name: 'foo' },
                        prop: { type: 'Identifier', name: 'bar' },
                    },
                    args: [],
                },
            },
        ],
    };

    expect(script).toEqual(expected);
});

test('multiple statements', () => {
    const code = [
        //
        'const a = 1',
        'let b = add(a, 2)',
        '// multiply b by 3',
        'b = multiply(b, 3)',
    ].join('\n');

    const script = parseScript(code);

    const expected: Script = {
        code,
        ast: [
            {
                type: 'Variable',
                name: 'a',
                value: { type: 'Literal', value: 1 },
                comment: undefined,
            },
            {
                type: 'Variable',
                name: 'b',
                value: {
                    type: 'FunctionCall',
                    func: { type: 'Identifier', name: 'add' },
                    args: [
                        { type: 'Identifier', name: 'a' },
                        { type: 'Literal', value: 2 },
                    ],
                },
            },
            {
                type: 'Expression',
                comment: 'multiply b by 3',
                expr: {
                    type: 'Assignment',
                    left: { type: 'Identifier', name: 'b' },
                    right: {
                        type: 'FunctionCall',
                        func: { type: 'Identifier', name: 'multiply' },
                        args: [
                            { type: 'Identifier', name: 'b' },
                            { type: 'Literal', value: 3 },
                        ],
                    },
                },
            },
        ],
    };

    expect(script).toEqual(expected);
});

test('object expression', () => {
    const code = 'const a = { b: 1 }';
    const script = parseScript(code);
    const expected: Script = {
        code,
        ast: [
            {
                type: 'Variable',
                name: 'a',
                value: {
                    type: 'Object',
                    props: [
                        {
                            key: { type: 'Identifier', name: 'b' },
                            value: { type: 'Literal', value: 1 },
                        },
                    ],
                },
            },
        ],
    };

    expect(script).toEqual(expected);
});

test('array expression', () => {
    const code = 'const a = [1, 2, 3]';
    const script = parseScript(code);
    const expected: Script = {
        code,
        ast: [
            {
                type: 'Variable',
                name: 'a',
                value: {
                    type: 'Array',
                    items: [
                        { type: 'Literal', value: 1 },
                        { type: 'Literal', value: 2 },
                        { type: 'Literal', value: 3 },
                    ],
                },
            },
        ],
    };

    expect(script).toEqual(expected);
});

test('create date', () => {
    const code = 'const a = new Date()';
    const script = parseScript(code);
    const expected: Script = {
        code,
        ast: [
            {
                type: 'Variable',
                name: 'a',
                value: {
                    type: 'New',
                    func: { type: 'Identifier', name: 'Date' },
                    args: [],
                },
            },
        ],
    };

    expect(script).toEqual(expected);
});
