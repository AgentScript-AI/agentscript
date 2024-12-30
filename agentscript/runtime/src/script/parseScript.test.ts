import { expect, test } from 'vitest';

import type { Script } from './astTypes.js';
import { parseScript } from './parseScript.js';

test('assign variable', () => {
    const script = parseScript('const a = 1');
    const expected: Script = [
        {
            type: 'VariableDeclaration',
            name: 'a',
            value: { type: 'Literal', value: 1 },
        },
    ];

    expect(script).toEqual(expected);
});

test('call function', () => {
    const script = parseScript('foo()');
    const expected: Script = [
        {
            type: 'ExpressionStatement',
            expression: {
                type: 'FunctionCall',
                name: 'foo',
                arguments: [],
            },
        },
    ];

    expect(script).toEqual(expected);
});

test('call function with arguments', () => {
    const script = parseScript('foo(1, 2, 3)');
    const expected: Script = [
        {
            type: 'ExpressionStatement',
            expression: {
                type: 'FunctionCall',
                name: 'foo',
                arguments: [
                    { type: 'Literal', value: 1 },
                    { type: 'Literal', value: 2 },
                    { type: 'Literal', value: 3 },
                ],
            },
        },
    ];

    expect(script).toEqual(expected);
});

test('call function and assign to variable', () => {
    const script = parseScript('const a = foo(1, 2, 3)');
    const expected: Script = [
        {
            type: 'VariableDeclaration',
            name: 'a',
            value: {
                type: 'FunctionCall',
                name: 'foo',
                arguments: [
                    { type: 'Literal', value: 1 },
                    { type: 'Literal', value: 2 },
                    { type: 'Literal', value: 3 },
                ],
            },
        },
    ];

    expect(script).toEqual(expected);
});

test('call member function', () => {
    const script = parseScript('foo.bar()');
    const expected: Script = [
        {
            type: 'ExpressionStatement',
            expression: { type: 'FunctionCall', name: 'foo.bar', arguments: [] },
        },
    ];

    expect(script).toEqual(expected);
});

test('multiple statements', () => {
    const script = parseScript([
        //
        'const a = 1',
        'let b = add(a, 2)',
        '// multiply b by 3',
        'b = multiply(b, 3)',
    ]);

    const expected: Script = [
        {
            type: 'VariableDeclaration',
            name: 'a',
            value: { type: 'Literal', value: 1 },
            comment: undefined,
        },
        {
            type: 'VariableDeclaration',
            name: 'b',
            value: {
                type: 'FunctionCall',
                name: 'add',
                arguments: [
                    { type: 'Variable', name: 'a' },
                    { type: 'Literal', value: 2 },
                ],
            },
        },
        {
            type: 'ExpressionStatement',
            comment: 'multiply b by 3',
            expression: {
                type: 'Assignment',
                left: { type: 'Variable', name: 'b' },
                right: {
                    type: 'FunctionCall',
                    name: 'multiply',
                    arguments: [
                        { type: 'Variable', name: 'b' },
                        { type: 'Literal', value: 3 },
                    ],
                },
            },
        },
    ];

    expect(script).toEqual(expected);
});
