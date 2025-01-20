import { describe, expect, test } from 'vitest';

import * as s from '@agentscript-ai/schema';
import { joinLines } from '@agentscript-ai/utils';

import { createRenderContext } from './renderContext.js';
import { renderType } from './renderType.js';

test('string', () => {
    const ctx = createRenderContext();
    const schema = s.string();
    const type = renderType({ schema, ctx });

    expect(type).toEqual('string');
    expect(ctx.code).toEqual('');
});

test('number', () => {
    const ctx = createRenderContext();
    const schema = s.number();
    const type = renderType({ schema, ctx });

    expect(type).toEqual('number');
    expect(ctx.code).toEqual('');
});

test('boolean', () => {
    const ctx = createRenderContext();
    const schema = s.boolean();
    const type = renderType({ schema, ctx });

    expect(type).toEqual('boolean');
    expect(ctx.code).toEqual('');
});

test('date', () => {
    const ctx = createRenderContext();
    const schema = s.date();
    const type = renderType({ schema, ctx });

    expect(type).toEqual('Date');
    expect(ctx.code).toEqual('');
});

test('void', () => {
    const ctx = createRenderContext();
    const schema = s.void();
    const type = renderType({ schema, ctx });

    expect(type).toEqual('void');
    expect(ctx.code).toEqual('');
});

test('unknown', () => {
    const ctx = createRenderContext();
    const schema = s.unknown();
    const type = renderType({ schema, ctx });

    expect(type).toEqual('unknown');
    expect(ctx.code).toEqual('');
});

test('enum', () => {
    const ctx = createRenderContext();
    const schema = s.enum(['foo', 'bar']);
    const type = renderType({ schema, ctx });

    expect(type).toEqual('"foo" | "bar"');
    expect(ctx.code).toEqual('');
});

test('string nullable', () => {
    const ctx = createRenderContext();
    const schema = s.string({ nullable: true });
    const type = renderType({ schema, ctx });

    expect(type).toEqual('string | null');
    expect(ctx.code).toEqual('');
});

test('string optional', () => {
    const ctx = createRenderContext();
    const schema = s.string({ optional: true });
    const type = renderType({ schema, ctx });

    expect(type).toEqual('string | undefined');
    expect(ctx.code).toEqual('');
});

test('string nullable and optional', () => {
    const schema = s.string({ nullable: true, optional: true });
    const ctx = createRenderContext();

    const type = renderType({ schema, ctx });

    expect(type).toEqual('string | null | undefined');
    expect(ctx.code).toEqual('');
});

test('custom type nullable', () => {
    const schema = s.object({ props: { name: s.string() } });
    const ctx = createRenderContext();
    ctx.addType(schema, 'Foo');

    const type = renderType({ schema: s.nullable(schema), ctx });

    expect(type).toEqual('Foo | null');
    expect(ctx.code).toEqual('');
});

describe('object', () => {
    test('basic', () => {
        const schema = s.object({ props: { name: s.string() } });
        const ctx = createRenderContext();
        const type = renderType({ schema, ctx });

        expect(type).toEqual('{\n  name: string;\n}');
        expect(ctx.code).toEqual('');
    });

    test('nullable', () => {
        const schema = s.object({ props: { name: s.string() } });
        const ctx = createRenderContext();
        const type = renderType({ schema: s.nullable(schema), ctx });

        expect(type).toEqual('{\n  name: string;\n} | null');
        expect(ctx.code).toEqual('');
    });

    test('optional', () => {
        const schema = s.object({ props: { name: s.string() } });
        const ctx = createRenderContext();
        const type = renderType({ schema: s.optional(schema), ctx });

        expect(type).toEqual('{\n  name: string;\n} | undefined');
        expect(ctx.code).toEqual('');
    });

    test('nullable and optional', () => {
        const schema = s.object({
            props: { name: s.string() },
            nullable: true,
            optional: true,
        });
        const ctx = createRenderContext();
        const type = renderType({ schema, ctx });

        expect(type).toEqual('{\n  name: string;\n} | null | undefined');
        expect(ctx.code).toEqual('');
    });

    test('multiple properties', () => {
        const schema = s.object({
            props: {
                name: s.string(),
                email: s.string({ email: true, nullable: true }),
                age: s.number({ optional: true }),
                birthDate: s.date({ optional: true }),
                isActive: s.boolean({ optional: true, nullable: true }),
            },
        });
        const ctx = createRenderContext();
        const type = renderType({ schema, ctx });

        expect(type).toEqual(
            '{\n  name: string;\n  email: string | null;\n  age?: number;\n  birthDate?: Date;\n  isActive?: boolean | null;\n}',
        );
        expect(ctx.code).toEqual('');
    });

    test('nested object', () => {
        const schema = s.object({
            props: {
                user: s.object({ props: { name: s.string() } }),
            },
        });
        const ctx = createRenderContext();
        const type = renderType({ schema, ctx });

        expect(type).toEqual('{\n  user: {\n    name: string;\n  };\n}');
        expect(ctx.code).toEqual('');
    });

    test('custom props', () => {
        const child = s.object({
            props: { name: s.string() },
        });
        const schema = s.object({
            props: { child },
        });

        const ctx = createRenderContext();
        ctx.addType(child, 'Child');

        const type = renderType({ schema, ctx });

        expect(type).toEqual('{\n  child: Child;\n}');
        expect(ctx.code).toEqual('');
    });

    test('named object', () => {
        const child = s.object({
            name: 'Child',
            props: { name: s.string() },
        });

        const schema = s.object({
            props: { child },
        });

        const ctx = createRenderContext();
        const type = renderType({ schema, ctx });

        expect(ctx.code).toEqual(
            joinLines([
                //
                'export type Child = {',
                '  name: string;',
                '}',
            ]),
        );
        expect(type).toEqual('{\n  child: Child;\n}');
    });

    test('custom nullable props', () => {
        const child = s.object({
            name: 'Child',
            props: { name: s.string() },
        });
        const schema = s.object({
            props: { child: s.nullable(child) },
        });

        const ctx = createRenderContext();
        const type = renderType({ schema, ctx });

        expect(ctx.code).toEqual(
            joinLines([
                //
                'export type Child = {',
                '  name: string;',
                '}',
            ]),
        );
        expect(type).toEqual('{\n  child: Child | null;\n}');
    });

    test('custom optional props', () => {
        const child = s.object({
            name: 'Child',
            props: { name: s.string() },
        });
        const schema = s.object({
            props: { child: s.optional(child) },
        });

        const ctx = createRenderContext();
        const type = renderType({ schema, ctx });

        expect(ctx.code).toEqual(
            joinLines([
                //
                'export type Child = {',
                '  name: string;',
                '}',
            ]),
        );
        expect(type).toEqual('{\n  child?: Child;\n}');
    });

    test('props with description', () => {
        const schema = s.object({
            props: {
                name: s.string({
                    description: 'The name of the person',
                }),
                age: s.number({
                    optional: true,
                    description: 'The age of the person',
                }),
            },
        });
        const ctx = createRenderContext();
        const type = renderType({ schema, ctx });

        expect(ctx.code).toEqual('');
        expect(type).toEqual(
            joinLines([
                '{',
                '  /** The name of the person */',
                '  name: string;',
                '  /** The age of the person */',
                '  age?: number;',
                '}',
            ]),
        );
    });

    test('custom props with description', () => {
        const child = s.object({
            name: 'Child',
            props: {
                name: s.string({
                    description: 'The name of the child',
                }),
            },
        });
        const schema = s.object({
            props: {
                child: s.extend(child, { description: 'The child of the person' }),
            },
        });

        const ctx = createRenderContext();
        const type = renderType({ schema, ctx });

        expect(ctx.code).toEqual(
            joinLines([
                //
                'export type Child = {',
                '  /** The name of the child */',
                '  name: string;',
                '}',
            ]),
        );
        expect(type).toEqual(
            joinLines([
                //
                '{',
                '  /** The child of the person */',
                '  child: Child;',
                '}',
            ]),
        );
    });

    test('unnamed nested object', () => {
        const child = s.object({
            props: {
                name: s.string({
                    description: 'The name of the child',
                }),
            },
        });
        const schema = s.object({
            props: {
                child: s.extend(child, { description: 'The child of the person' }),
            },
        });

        const ctx = createRenderContext();
        const type = renderType({ schema, ctx });

        expect(ctx.code).toEqual('');
        expect(type).toEqual(
            joinLines([
                //
                '{',
                '  /** The child of the person */',
                '  child: {',
                '    /** The name of the child */',
                '    name: string;',
                '  };',
                '}',
            ]),
        );
    });

    test('double nested object', () => {
        const toy = s.object({
            name: 'Toy',
            props: {
                name: s.string({
                    description: 'The name of the toy',
                }),
            },
        });

        const child = s.object({
            name: 'Child',
            props: {
                name: s.string({
                    description: 'The name of the child',
                }),
                toys: s.array({
                    of: toy,
                    description: 'The toys of the child',
                }),
            },
        });

        const schema = s.object({
            name: 'Person',
            props: {
                child: s.extend(child, { description: 'The child of the person' }),
            },
        });

        const ctx = createRenderContext();
        const type = renderType({ schema, ctx });

        expect(ctx.code).toEqual(
            joinLines([
                //
                'export type Toy = {',
                '  /** The name of the toy */',
                '  name: string;',
                '}',
                '',
                'export type Child = {',
                '  /** The name of the child */',
                '  name: string;',
                '  /** The toys of the child */',
                '  toys: Toy[];',
                '}',
                '',
                'export type Person = {',
                '  /** The child of the person */',
                '  child: Child;',
                '}',
            ]),
        );
        expect(type).toEqual('Person');
    });

    test('same type twice', () => {
        const child = s.object({
            name: 'Child',
            props: {
                name: s.string({
                    description: 'The name of the child',
                }),
            },
        });

        const schema = s.object({
            name: 'Person',
            props: {
                child: s.extend(child, { description: 'The child of the person' }),
                child2: s.extend(child, { description: 'The child of the person' }),
            },
        });

        const ctx = createRenderContext();
        const type = renderType({ schema, ctx });

        expect(ctx.code).toEqual(
            joinLines([
                //
                'export type Child = {',
                '  /** The name of the child */',
                '  name: string;',
                '}',
                '',
                'export type Person = {',
                '  /** The child of the person */',
                '  child: Child;',
                '  /** The child of the person */',
                '  child2: Child;',
                '}',
            ]),
        );
        expect(type).toEqual('Person');
    });

    test('name collision', () => {
        const child = s.object({
            name: 'Child',
            props: { name: s.string() },
        });

        const child2 = s.object({
            name: 'Child',
            props: { age: s.number() },
        });

        const person = s.object({
            name: 'Person',
            props: { child, child2 },
        });

        const ctx = createRenderContext();
        const type = renderType({ schema: person, ctx });

        expect(ctx.code).toEqual(
            joinLines([
                'export type Child = {',
                '  name: string;',
                '}',
                '',
                'export type Child2 = {',
                '  age: number;',
                '}',
                '',
                'export type Person = {',
                '  child: Child;',
                '  child2: Child2;',
                '}',
            ]),
        );
        expect(type).toEqual('Person');
    });

    test('custom array props', () => {
        const child = s.object({
            name: 'Child',
            props: { name: s.string() },
        });

        const parent = s.object({
            props: {
                children: s.array({
                    of: child,
                    description: 'The children of the person',
                }),
            },
        });

        const ctx = createRenderContext();
        const type = renderType({ schema: parent, ctx });

        expect(ctx.code).toEqual(
            joinLines([
                //
                'export type Child = {',
                '  name: string;',
                '}',
            ]),
        );
        expect(type).toEqual(
            joinLines([
                //
                '{',
                '  /** The children of the person */',
                '  children: Child[];',
                '}',
            ]),
        );
    });
});

describe('array', () => {
    test('string array', () => {
        const schema = s.array(s.string());
        const ctx = createRenderContext();
        const type = renderType({ schema, ctx });

        expect(type).toEqual('string[]');
        expect(ctx.code).toEqual('');
    });

    test('object array', () => {
        const schema = s.array(s.object({ props: { name: s.string() } }));
        const ctx = createRenderContext();
        const type = renderType({ schema, ctx });

        expect(ctx.code).toEqual('');
        expect(type).toEqual(
            joinLines([
                //
                '{',
                '  name: string;',
                '}[]',
            ]),
        );
    });

    test('array of optional', () => {
        const schema = s.array(s.optional(s.string()));
        const ctx = createRenderContext();
        const type = renderType({ schema, ctx });

        expect(type).toEqual('(string | undefined)[]');
        expect(ctx.code).toEqual('');
    });
});

describe('union', () => {
    test('basic', () => {
        const schema = s.union([s.string(), s.number()]);
        const ctx = createRenderContext();
        const type = renderType({ schema, ctx });

        expect(type).toEqual('string | number');
        expect(ctx.code).toEqual('');
    });

    test('nullable', () => {
        const schema = s.union([s.string(), s.number()]);
        const ctx = createRenderContext();
        const type = renderType({ schema: s.nullable(schema), ctx });

        expect(type).toEqual('string | number | null');
        expect(ctx.code).toEqual('');
    });

    test('optional', () => {
        const schema = s.union([s.string(), s.number()]);
        const ctx = createRenderContext();
        const type = renderType({ schema: s.optional(schema), ctx });

        expect(type).toEqual('string | number | undefined');
        expect(ctx.code).toEqual('');
    });

    test('nullable and optional', () => {
        const schema = s.union([s.string(), s.number()]);
        const ctx = createRenderContext();
        const type = renderType({ schema: s.nullable(s.optional(schema)), ctx });

        expect(type).toEqual('string | number | null | undefined');
        expect(ctx.code).toEqual('');
    });

    test('object', () => {
        const schema = s.union([
            s.object({ props: { name: s.string() } }),
            s.object({ props: { age: s.number() } }),
        ]);
        const ctx = createRenderContext();
        const type = renderType({ schema, ctx });

        expect(ctx.code).toEqual('');
        expect(type).toEqual(
            joinLines([
                //
                '{',
                '  name: string;',
                '} | {',
                '  age: number;',
                '}',
            ]),
        );
    });

    test('named object', () => {
        const user = s.object({
            name: 'User',
            props: { name: s.string() },
        });

        const ctx = createRenderContext();
        const schema = s.union([user, s.object({ props: { age: s.number() } })]);
        const type = renderType({ schema, ctx });

        expect(ctx.code).toEqual(
            joinLines([
                //
                'export type User = {',
                '  name: string;',
                '}',
            ]),
        );
        expect(type).toEqual(
            joinLines([
                //
                'User | {',
                '  age: number;',
                '}',
            ]),
        );
    });

    test('array', () => {
        const schema = s.union([s.array(s.string()), s.array(s.number())]);
        const ctx = createRenderContext();
        const type = renderType({ schema, ctx });

        expect(type).toEqual('string[] | number[]');
        expect(ctx.code).toEqual('');
    });

    test('array of unions', () => {
        const schema = s.array(s.union([s.string(), s.number()]));
        const ctx = createRenderContext();
        const type = renderType({ schema, ctx });

        expect(type).toEqual('(string | number)[]');
        expect(ctx.code).toEqual('');
    });
});
