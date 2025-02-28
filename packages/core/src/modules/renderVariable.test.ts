import { expect, test } from 'vitest';

import * as s from '@agentscript-ai/schema';

import { createRenderContext } from './renderContext.js';
import { renderVariable } from './renderVariable.js';
import { joinLines } from '@agentscript-ai/utils';

test('simple const', () => {
    const ctx = createRenderContext();
    renderVariable({
        name: 'foo',
        type: s.string(),
        const: true,
        ctx,
    });

    expect(ctx.code).toBe('const foo: string');
});

test('simple let', () => {
    const ctx = createRenderContext();
    renderVariable({
        name: 'foo',
        type: s.string(),
        ctx,
    });

    expect(ctx.code).toBe('let foo: string');
});

test('const with description', () => {
    const ctx = createRenderContext();
    renderVariable({
        name: 'foo',
        type: s.string(),
        description: 'This is a foo variable',
        const: true,
        ctx,
    });

    expect(ctx.code).toBe(
        joinLines([
            //
            '/** This is a foo variable */',
            'const foo: string',
        ]),
    );
});

test('const with description and type description', () => {
    const ctx = createRenderContext();
    renderVariable({
        name: 'foo',
        type: s.string({
            description: 'This is a string',
        }),
        description: 'This is a foo variable',
        const: true,
        ctx,
    });

    expect(ctx.code).toBe(
        joinLines([
            //
            '/**',
            ' * This is a foo variable',
            ' * This is a string',
            ' */',
            'const foo: string',
        ]),
    );
});

test('inline object', () => {
    const ctx = createRenderContext();

    renderVariable({
        name: 'foo',
        type: s.object({
            props: {
                name: s.string(),
            },
        }),
        description: 'This is a foo variable',
        const: true,
        ctx,
    });

    expect(ctx.code).toBe(
        joinLines([
            //
            '/** This is a foo variable */',
            'const foo: {',
            '  name: string;',
            '}',
        ]),
    );
});

test('custom named object', () => {
    const ctx = createRenderContext();

    const User = s.object({
        name: 'User',
        props: {
            name: s.string(),
        },
    });

    renderVariable({
        name: 'user',
        type: User,
        ctx,
    });

    expect(ctx.code).toBe(
        joinLines([
            //
            'type User = {',
            '  name: string;',
            '}',
            '',
            'let user: User',
        ]),
    );
});
