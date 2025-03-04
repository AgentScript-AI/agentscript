import { expect, test } from 'vitest';

import type { Script } from './astTypes.js';
import { parseScript } from './parseScript.js';

test('regex expression', () => {
    const code = 'const a = /test/';

    const script = parseScript(code);
    const expected: Script = {
        code,
        ast: [
            {
                type: 'var',
                id: 'a',
                value: { type: 'regex', value: 'test' },
            },
        ],
    };

    expect(script).toEqual(expected);
});

test('regex expression with flags', () => {
    const code = 'const a = /test/i';

    const script = parseScript(code);
    const expected: Script = {
        code,
        ast: [
            {
                type: 'var',
                id: 'a',
                value: {
                    type: 'regex',
                    value: 'test',
                    flags: 'i',
                },
            },
        ],
    };

    expect(script).toEqual(expected);
});

test('new regex expression', () => {
    const code = 'const a = new RegExp("test", "i")';
    const script = parseScript(code);

    const expected: Script = {
        code,
        ast: [
            {
                type: 'var',
                id: 'a',
                value: {
                    type: 'new',
                    func: { type: 'ident', name: 'RegExp' },
                    args: [
                        { type: 'literal', value: 'test' },
                        { type: 'literal', value: 'i' },
                    ],
                },
            },
        ],
    };

    expect(script).toEqual(expected);
});
