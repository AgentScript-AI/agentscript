import { expect, test } from 'vitest';

import * as s from '@agentscript-ai/schema';

import { renderVariable } from './renderVariable.js';
import { createTypeResolver } from './typeResolver.js';

test('simple const', () => {
    const result = renderVariable({
        name: 'foo',
        type: s.string(),
        const: true,
    });

    expect(result).toBe('const foo: string');
});

test('simple let', () => {
    const result = renderVariable({
        name: 'foo',
        type: s.string(),
    });

    expect(result).toBe('let foo: string');
});

test('const with description', () => {
    const result = renderVariable({
        name: 'foo',
        type: s.string(),
        description: 'This is a foo variable',
        const: true,
    });

    const code = [
        //
        '/** This is a foo variable */',
        'const foo: string',
    ];

    expect(result).toBe(code.join('\n'));
});

test('const with description and type description', () => {
    const result = renderVariable({
        name: 'foo',
        type: s.string({
            description: 'This is a string',
        }),
        description: 'This is a foo variable',
        const: true,
    });

    const code = [
        '/**',
        ' * This is a foo variable',
        ' * This is a string',
        ' */',
        'const foo: string',
    ];

    expect(result).toBe(code.join('\n'));
});

test('inline object', () => {
    const result = renderVariable({
        name: 'foo',
        type: s.object({
            props: {
                name: s.string(),
            },
        }),
        description: 'This is a foo variable',
        const: true,
    });

    const code = [
        //
        '/** This is a foo variable */',
        'const foo: {',
        '  name: string;',
        '}',
    ];

    expect(result).toBe(code.join('\n'));
});

test('custom named object', () => {
    const User = s.object({
        props: {
            name: s.string(),
        },
    });

    const resolver = createTypeResolver();
    resolver.add('User', User);

    const result = renderVariable({
        name: 'user',
        type: User,
        typeResolver: resolver,
    });

    const code = 'let user: User';

    expect(result).toBe(code);
});
