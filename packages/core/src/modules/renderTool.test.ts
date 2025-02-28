import { expect, test } from 'vitest';

import * as s from '@agentscript-ai/schema';
import { joinLines } from '@agentscript-ai/utils';

import { createRenderContext } from './renderContext.js';
import { renderTool } from './renderTool.js';
import { defineTool } from '../tools/defineTool.js';

const User = s.object({
    name: 'User',
    props: {
        name: s.string(),
        email: s.string(),
    },
});

test('noop tool', () => {
    const noop = defineTool({
        description: 'Noop',
        handler: () => {},
    });

    const ctx = createRenderContext();
    renderTool({
        tool: noop,
        name: 'noop',
        ctx,
    });

    expect(ctx.code).toEqual(
        joinLines([
            //
            '/** Noop */',
            'function noop(): void;',
        ]),
    );
});

test('tool with single input', () => {
    const tool = defineTool({
        description: 'A tool',
        input: {
            a: s.string({
                description: 'The A param',
            }),
        },
        handler: () => {},
    });

    const ctx = createRenderContext();
    renderTool({
        tool,
        name: 'foo',
        ctx,
    });

    expect(ctx.code).toEqual(
        joinLines([
            //
            '/**',
            ' * A tool',
            ' * @param a - The A param',
            ' */',
            'function foo(a: string): void;',
        ]),
    );
});

test('tool with two inputs', () => {
    const tool = defineTool({
        description: 'A tool',
        input: {
            a: s.string({
                description: 'The A param',
            }),
            b: s.string({
                description: 'The B param',
            }),
        },
        handler: () => {},
    });

    const ctx = createRenderContext();
    renderTool({
        tool,
        name: 'foo',
        ctx,
    });

    expect(ctx.code).toEqual(
        joinLines([
            //
            '/**',
            ' * A tool',
            ' * @param a - The A param',
            ' * @param b - The B param',
            ' */',
            'function foo(a: string, b: string): void;',
        ]),
    );
});

test('tool with three inputs', () => {
    const tool = defineTool({
        description: 'A tool',
        input: {
            a: s.string({
                description: 'The A param',
            }),
            b: s.string({
                description: 'The B param',
            }),
            c: s.string({
                description: 'The C param',
            }),
        },
        handler: () => {},
    });

    const ctx = createRenderContext();
    renderTool({
        tool,
        name: 'foo',
        ctx,
    });

    expect(ctx.code).toEqual(
        joinLines([
            'type FooParams = {',
            '  /** The A param */',
            '  a: string;',
            '  /** The B param */',
            '  b: string;',
            '  /** The C param */',
            '  c: string;',
            '}',
            '',
            '/** A tool */',
            'function foo(params: FooParams): void;',
        ]),
    );
});

test('tool with output', () => {
    const tool = defineTool({
        description: 'A tool',
        output: s.string(),
        handler: () => 'foo',
    });

    const ctx = createRenderContext();
    renderTool({
        tool,
        name: 'foo',
        ctx,
    });

    expect(ctx.code).toEqual(
        joinLines([
            //
            '/** A tool */',
            'function foo(): string;',
        ]),
    );
});

test('tool with output and input', () => {
    const tool = defineTool({
        description: 'A tool',
        input: {
            a: s.string(),
        },
        output: s.string(),
        handler: () => 'foo',
    });

    const ctx = createRenderContext();
    renderTool({
        tool,
        name: 'foo',
        ctx,
    });

    expect(ctx.code).toEqual(
        joinLines([
            //
            '/** A tool */',
            'function foo(a: string): string;',
        ]),
    );
});

test('tool with output with description', () => {
    const tool = defineTool({
        description: 'A tool',
        output: s.string({
            description: 'The output',
        }),
        handler: () => 'foo',
    });

    const ctx = createRenderContext();
    renderTool({
        tool,
        name: 'foo',
        ctx,
    });

    expect(ctx.code).toEqual(
        joinLines([
            //
            '/**',
            ' * A tool',
            ' * @returns The output',
            ' */',
            'function foo(): string;',
        ]),
    );
});

test('tool with object input', () => {
    const tool = defineTool({
        description: 'A tool',
        input: {
            user: s.extend(User, {
                description: 'The user',
            }),
        },
        handler: () => {},
    });

    const ctx = createRenderContext();
    renderTool({
        tool,
        name: 'foo',
        ctx,
    });

    expect(ctx.code).toEqual(
        joinLines([
            //
            'type User = {',
            '  name: string;',
            '  email: string;',
            '}',
            '',
            '/**',
            ' * A tool',
            ' * @param user - The user',
            ' */',
            'function foo(user: User): void;',
        ]),
    );
});

test('tool with object output', () => {
    const tool = defineTool({
        description: 'A tool',
        input: {
            id: s.string({
                description: 'The id of the user',
            }),
        },
        output: s.extend(User, {
            description: 'The user',
        }),
        handler: () => ({ name: 'John', email: 'john@example.com' }),
    });

    const ctx = createRenderContext();
    renderTool({
        tool,
        name: 'foo',
        ctx,
    });

    expect(ctx.code).toEqual(
        joinLines([
            //
            'type User = {',
            '  name: string;',
            '  email: string;',
            '}',
            '',
            '/**',
            ' * A tool',
            ' * @param id - The id of the user',
            ' * @returns The user',
            ' */',
            'function foo(id: string): User;',
        ]),
    );
});

test('tool with object input and output', () => {
    const tool = defineTool({
        description: 'A tool',
        input: {
            user: s.extend(User, {
                description: 'The user',
            }),
        },
        output: s.extend(User, {
            description: 'The output',
        }),
        handler: () => ({ name: 'John', email: 'john@example.com' }),
    });

    const ctx = createRenderContext();
    renderTool({
        tool,
        name: 'foo',
        ctx,
    });

    expect(ctx.code).toEqual(
        joinLines([
            //
            'type User = {',
            '  name: string;',
            '  email: string;',
            '}',
            '',
            '/**',
            ' * A tool',
            ' * @param user - The user',
            ' * @returns The output',
            ' */',
            'function foo(user: User): User;',
        ]),
    );
});

test('explicit input object schema', () => {
    const input = s.object({
        props: {
            a: s.number({ description: 'The first number' }),
            b: s.number({ description: 'The second number' }),
            c: s.number({ description: 'The third number' }),
        },
    });

    const tool = defineTool({
        description: 'Get a foobar',
        input: input,
        output: s.number(),
        handler({ input }) {
            return input.a + input.b + input.c;
        },
    });

    const ctx = createRenderContext();
    renderTool({
        tool,
        name: 'foo',
        ctx,
    });

    expect(ctx.code).toEqual(
        joinLines([
            'type FooParams = {',
            '  /** The first number */',
            '  a: number;',
            '  /** The second number */',
            '  b: number;',
            '  /** The third number */',
            '  c: number;',
            '}',
            '',
            '/** Get a foobar */',
            'function foo(params: FooParams): number;',
        ]),
    );
});

test('explicit input object schema', () => {
    const input = s.object({
        props: {
            a: s.number({ description: 'The first number' }),
            b: s.number({ description: 'The second number' }),
            c: s.number({ description: 'The third number' }),
        },
    });

    const tool = defineTool({
        description: 'Get a foobar',
        input: s.extend(input, {
            description: 'The input',
        }),
        output: s.number(),
        handler({ input }) {
            return input.a + input.b + input.c;
        },
    });

    const ctx = createRenderContext();
    renderTool({
        tool,
        name: 'foo',
        ctx,
    });

    expect(ctx.code).toEqual(
        joinLines([
            'type FooParams = {',
            '  /** The first number */',
            '  a: number;',
            '  /** The second number */',
            '  b: number;',
            '  /** The third number */',
            '  c: number;',
            '}',
            '',
            '/**',
            ' * Get a foobar',
            ' * @param params - The input',
            ' */',
            'function foo(params: FooParams): number;',
        ]),
    );
});

test('explicit input schema with name', () => {
    const input = s.object({
        name: 'Params',
        props: {
            a: s.number({ description: 'The first number' }),
            b: s.number({ description: 'The second number' }),
            c: s.number({ description: 'The third number' }),
        },
    });

    const tool = defineTool({
        description: 'Get a foobar',
        input: input,
        output: s.number(),
        handler({ input }) {
            return input.a + input.b + input.c;
        },
    });

    const ctx = createRenderContext();
    renderTool({
        tool,
        name: 'foo',
        ctx,
    });

    expect(ctx.code).toEqual(
        joinLines([
            'type Params = {',
            '  /** The first number */',
            '  a: number;',
            '  /** The second number */',
            '  b: number;',
            '  /** The third number */',
            '  c: number;',
            '}',
            '',
            '/** Get a foobar */',
            'function foo(params: Params): number;',
        ]),
    );
});

test('explicit input schema with name and description', () => {
    const input = s.object({
        name: 'Params',
        props: {
            a: s.number({ description: 'The first number' }),
            b: s.number({ description: 'The second number' }),
            c: s.number({ description: 'The third number' }),
        },
    });

    const tool = defineTool({
        description: 'Get a foobar',
        input: s.extend(input, {
            description: 'The input',
        }),
        output: s.number(),
        handler({ input }) {
            return input.a + input.b + input.c;
        },
    });

    const ctx = createRenderContext();
    renderTool({
        tool,
        name: 'foo',
        ctx,
    });

    expect(ctx.code).toEqual(
        joinLines([
            'type Params = {',
            '  /** The first number */',
            '  a: number;',
            '  /** The second number */',
            '  b: number;',
            '  /** The third number */',
            '  c: number;',
            '}',
            '',
            '/**',
            ' * Get a foobar',
            ' * @param params - The input',
            ' */',
            'function foo(params: Params): number;',
        ]),
    );
});
