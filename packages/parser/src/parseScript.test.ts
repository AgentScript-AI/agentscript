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

test('undefined literal', () => {
    const code = 'const a = undefined;';
    const script = parseScript(code);
    const expected: Script = {
        code,
        ast: [
            {
                type: 'var',
                name: 'a',
                value: { type: 'literal', value: undefined },
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
                type: 'call',
                func: { type: 'ident', name: 'foo' },
                args: undefined,
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
                type: 'call',
                func: { type: 'ident', name: 'foo' },
                args: [
                    { type: 'literal', value: 1 },
                    { type: 'literal', value: 2 },
                    { type: 'literal', value: 3 },
                ],
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
                type: 'call',
                func: {
                    type: 'member',
                    obj: { type: 'ident', name: 'foo' },
                    prop: 'bar',
                },
                args: undefined,
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
                type: 'assign',
                comment: 'multiply b by 3',
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
        ],
    };

    expect(script).toEqual(expected);
});

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
                    args: undefined,
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

test('top level return', () => {
    const code = 'return 1';
    const script = parseScript(code);
    const expected: Script = {
        code,
        ast: [{ type: 'return', value: { type: 'literal', value: 1 } }],
    };

    expect(script).toEqual(expected);
});
