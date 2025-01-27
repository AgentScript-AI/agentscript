import { expect, test } from 'vitest';

import type { Script } from './astTypes.js';
import { parseScript } from './parseScript.js';

test('template literal without interpolation', () => {
    const code = '`Hello, world!`';
    const script = parseScript(code);

    const expected: Script = {
        code,
        ast: [
            {
                type: 'template',
                parts: ['Hello, world!'],
            },
        ],
    };

    expect(script).toEqual(expected);
});

test('template literal with var interpolation in the middle', () => {
    const code = '`Hello, ${name}!`';
    const script = parseScript(code);

    const expected: Script = {
        code,
        ast: [
            {
                type: 'template',
                parts: ['Hello, ', { type: 'ident', name: 'name' }, '!'],
            },
        ],
    };

    expect(script).toEqual(expected);
});

test('template literal with var interpolation at the end', () => {
    const code = '`Hello, ${name}`;';
    const script = parseScript(code);

    const expected: Script = {
        code,
        ast: [
            {
                type: 'template',
                parts: ['Hello, ', { type: 'ident', name: 'name' }],
            },
        ],
    };

    expect(script).toEqual(expected);
});

test('template literal with var interpolation at the beginning', () => {
    const code = '`${name}, Hello!`';
    const script = parseScript(code);

    const expected: Script = {
        code,
        ast: [{ type: 'template', parts: [{ type: 'ident', name: 'name' }, ', Hello!'] }],
    };

    expect(script).toEqual(expected);
});

test('template literal with function call', () => {
    const code = '`Hello, ${name.toUpperCase()}!`';
    const script = parseScript(code);

    const expected: Script = {
        code,
        ast: [
            {
                type: 'template',
                parts: [
                    'Hello, ',
                    {
                        type: 'call',
                        func: {
                            type: 'member',
                            obj: { type: 'ident', name: 'name' },
                            prop: { type: 'ident', name: 'toUpperCase' },
                        },
                        args: undefined,
                    },
                    '!',
                ],
            },
        ],
    };

    expect(script).toEqual(expected);
});

test('template literal with two var interpolations', () => {
    const code = '`${name1}, ${name2}!`';
    const script = parseScript(code);

    const expected: Script = {
        code,
        ast: [
            {
                type: 'template',
                parts: [
                    { type: 'ident', name: 'name1' },
                    ', ',
                    { type: 'ident', name: 'name2' },
                    '!',
                ],
            },
        ],
    };

    expect(script).toEqual(expected);
});

test('template literal with two var interpolations without spaces', () => {
    const code = '`${name1}${name2}`';
    const script = parseScript(code);

    const expected: Script = {
        code,
        ast: [
            {
                type: 'template',
                parts: [
                    { type: 'ident', name: 'name1' },
                    { type: 'ident', name: 'name2' },
                ],
            },
        ],
    };

    expect(script).toEqual(expected);
});
