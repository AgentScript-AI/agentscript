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
                type: 'var',
                name: 'a',
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
                name: 'a',
                value: { type: 'literal', value: -1 },
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
                type: 'expr',
                expr: {
                    type: 'call',
                    func: { type: 'ident', name: 'foo' },
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
                type: 'expr',
                expr: {
                    type: 'call',
                    func: { type: 'ident', name: 'foo' },
                    args: [
                        { type: 'literal', value: 1 },
                        { type: 'literal', value: 2 },
                        { type: 'literal', value: 3 },
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
                type: 'var',
                name: 'a',
                value: {
                    type: 'call',
                    func: { type: 'ident', name: 'foo' },
                    args: [
                        { type: 'literal', value: 1 },
                        { type: 'literal', value: 2 },
                        { type: 'literal', value: 3 },
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
                type: 'expr',
                expr: {
                    type: 'call',
                    func: {
                        type: 'member',
                        obj: { type: 'ident', name: 'foo' },
                        prop: { type: 'ident', name: 'bar' },
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
                type: 'var',
                name: 'a',
                value: { type: 'literal', value: 1 },
                comment: undefined,
            },
            {
                type: 'var',
                name: 'b',
                value: {
                    type: 'call',
                    func: { type: 'ident', name: 'add' },
                    args: [
                        { type: 'ident', name: 'a' },
                        { type: 'literal', value: 2 },
                    ],
                },
            },
            {
                type: 'expr',
                comment: 'multiply b by 3',
                expr: {
                    type: 'assign',
                    left: { type: 'ident', name: 'b' },
                    right: {
                        type: 'call',
                        func: { type: 'ident', name: 'multiply' },
                        args: [
                            { type: 'ident', name: 'b' },
                            { type: 'literal', value: 3 },
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
                type: 'var',
                name: 'a',
                value: {
                    type: 'obj',
                    props: [
                        {
                            key: { type: 'ident', name: 'b' },
                            value: { type: 'literal', value: 1 },
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
                type: 'var',
                name: 'a',
                value: {
                    type: 'arr',
                    items: [
                        { type: 'literal', value: 1 },
                        { type: 'literal', value: 2 },
                        { type: 'literal', value: 3 },
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
                type: 'var',
                name: 'a',
                value: {
                    type: 'new',
                    func: { type: 'ident', name: 'Date' },
                    args: [],
                },
            },
        ],
    };

    expect(script).toEqual(expected);
});
