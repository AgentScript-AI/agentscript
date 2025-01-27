import { expect, test } from 'vitest';

import { joinLines } from '@agentscript-ai/utils';

import type { Script } from './astTypes.js';
import { parseScript } from './parseScript.js';

test('if statement', () => {
    const code = joinLines([
        //
        'if (a > 0) {',
        '    foo()',
        '}',
    ]);

    const script = parseScript(code);

    const expected: Script = {
        code,
        ast: [
            {
                type: 'if',
                if: {
                    type: 'operator',
                    operator: '>',
                    left: { type: 'ident', name: 'a' },
                    right: { type: 'literal', value: 0 },
                },
                then: {
                    type: 'block',
                    body: [
                        {
                            type: 'call',
                            func: { type: 'ident', name: 'foo' },
                        },
                    ],
                },
            },
        ],
    };

    expect(script).toMatchObject(expected);
});

test('if-else statement', () => {
    const code = joinLines([
        //
        'if (a > 0) {',
        '    foo()',
        '} else {',
        '    bar()',
        '}',
    ]);

    const script = parseScript(code);

    const expected: Script = {
        code,
        ast: [
            {
                type: 'if',
                if: {
                    type: 'operator',
                    operator: '>',
                    left: { type: 'ident', name: 'a' },
                    right: { type: 'literal', value: 0 },
                },
                then: {
                    type: 'block',
                    body: [{ type: 'call', func: { type: 'ident', name: 'foo' } }],
                },
                else: {
                    type: 'block',
                    body: [{ type: 'call', func: { type: 'ident', name: 'bar' } }],
                },
            },
        ],
    };

    expect(script).toMatchObject(expected);
});

test('if-elseif-else statement', () => {
    const code = joinLines([
        //
        'if (a > 0) {',
        '    foo()',
        '} else if (b > 0) {',
        '    bar()',
        '} else {',
        '    baz()',
        '}',
    ]);

    const script = parseScript(code);

    const expected: Script = {
        code,
        ast: [
            {
                type: 'if',
                if: {
                    type: 'operator',
                    operator: '>',
                    left: { type: 'ident', name: 'a' },
                    right: { type: 'literal', value: 0 },
                },
                then: {
                    type: 'block',
                    body: [{ type: 'call', func: { type: 'ident', name: 'foo' } }],
                },
                else: {
                    type: 'if',
                    if: {
                        type: 'operator',
                        operator: '>',
                        left: { type: 'ident', name: 'b' },
                        right: { type: 'literal', value: 0 },
                    },
                    then: {
                        type: 'block',
                        body: [{ type: 'call', func: { type: 'ident', name: 'bar' } }],
                    },
                    else: {
                        type: 'block',
                        body: [{ type: 'call', func: { type: 'ident', name: 'baz' } }],
                    },
                },
            },
        ],
    };

    expect(script).toMatchObject(expected);
});

test('ternary operator', () => {
    const code = joinLines([
        //
        'a ? b : c',
    ]);

    const script = parseScript(code);

    const expected: Script = {
        code,
        ast: [
            {
                type: 'ternary',
                if: { type: 'ident', name: 'a' },
                then: { type: 'ident', name: 'b' },
                else: { type: 'ident', name: 'c' },
            },
        ],
    };

    expect(script).toEqual(expected);
});
