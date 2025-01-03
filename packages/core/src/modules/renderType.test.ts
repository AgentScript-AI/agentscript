import { describe, expect, test } from 'vitest';

import * as s from '@agentscript-ai/schema';

import { renderTypeInline } from './renderType.js';
import { createTypeResolver } from './typeResolver.js';

test('string', () => {
    const schema = s.string();
    const code = renderTypeInline(schema);

    expect(code).toEqual('string');
});

test('number', () => {
    const schema = s.number();
    const code = renderTypeInline(schema);

    expect(code).toEqual('number');
});

test('boolean', () => {
    const schema = s.boolean();
    const code = renderTypeInline(schema);

    expect(code).toEqual('boolean');
});

test('date', () => {
    const schema = s.date();
    const code = renderTypeInline(schema);

    expect(code).toEqual('Date');
});

test('void', () => {
    const schema = s.void();
    const code = renderTypeInline(schema);

    expect(code).toEqual('void');
});

test('unknown', () => {
    const schema = s.unknown();
    const code = renderTypeInline(schema);

    expect(code).toEqual('unknown');
});

test('enum', () => {
    const schema = s.enum(['foo', 'bar']);
    const code = renderTypeInline(schema);

    expect(code).toEqual('"foo" | "bar"');
});

test('custom type nullable', () => {
    const schema = s.object({ props: { name: s.string() } });
    const resolver = createTypeResolver();
    resolver.add('Foo', schema);

    const code = renderTypeInline(s.nullable(schema), { typeResolver: resolver });

    expect(code).toEqual('Foo | null');
});

test('string nullable', () => {
    const schema = s.string({ nullable: true });
    const code = renderTypeInline(schema);

    expect(code).toEqual('string | null');
});

test('string optional', () => {
    const schema = s.string({ optional: true });
    const code = renderTypeInline(schema);

    expect(code).toEqual('string | undefined');
});

test('string nullable and optional', () => {
    const schema = s.string({ nullable: true, optional: true });
    const code = renderTypeInline(schema);

    expect(code).toEqual('string | null | undefined');
});

describe('object', () => {
    test('basic', () => {
        const schema = s.object({ props: { name: s.string() } });
        const code = renderTypeInline(schema);

        expect(code).toEqual('{\n  name: string;\n}');
    });

    test('nullable', () => {
        const schema = s.object({ props: { name: s.string() } });
        const code = renderTypeInline(s.nullable(schema));

        expect(code).toEqual('{\n  name: string;\n} | null');
    });

    test('optional', () => {
        const schema = s.object({ props: { name: s.string() } });
        const code = renderTypeInline(s.optional(schema));

        expect(code).toEqual('{\n  name: string;\n} | undefined');
    });

    test('nullable and optional', () => {
        const schema = s.object({
            props: { name: s.string() },
            nullable: true,
            optional: true,
        });
        const code = renderTypeInline(schema);

        expect(code).toEqual('{\n  name: string;\n} | null | undefined');
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
        const code = renderTypeInline(schema);

        expect(code).toEqual(
            '{\n  name: string;\n  email: string | null;\n  age?: number;\n  birthDate?: Date;\n  isActive?: boolean | null;\n}',
        );
    });

    test('nested object', () => {
        const schema = s.object({
            props: {
                user: s.object({ props: { name: s.string() } }),
            },
        });
        const code = renderTypeInline(schema);

        expect(code).toEqual('{\n  user: {\n    name: string;\n  };\n}');
    });

    test('custom props', () => {
        const child = s.object({
            props: { name: s.string() },
        });
        const schema = s.object({
            props: { child },
        });

        const resolver = createTypeResolver();
        resolver.add('Child', child);

        const code = renderTypeInline(schema, { typeResolver: resolver });

        expect(code).toEqual('{\n  child: Child;\n}');
    });

    test('custom nullable props', () => {
        const child = s.object({
            props: { name: s.string() },
        });
        const schema = s.object({
            props: { child: s.nullable(child) },
        });

        const resolver = createTypeResolver();
        resolver.add('Child', child);

        const code = renderTypeInline(schema, { typeResolver: resolver });

        expect(code).toEqual('{\n  child: Child | null;\n}');
    });

    test('custom optional props', () => {
        const child = s.object({
            props: { name: s.string() },
        });
        const schema = s.object({
            props: { child: s.optional(child) },
        });

        const resolver = createTypeResolver();
        resolver.add('Child', child);

        const code = renderTypeInline(schema, { typeResolver: resolver });

        expect(code).toEqual('{\n  child?: Child;\n}');
    });

    test('props with description', () => {
        const schema = s.object({
            props: {
                name: s.string({ description: 'The name of the person' }),
                age: s.number({ optional: true, description: 'The age of the person' }),
            },
        });
        const code = renderTypeInline(schema);

        expect(code).toEqual(
            '{\n  /** The name of the person */\n  name: string;\n  /** The age of the person */\n  age?: number;\n}',
        );
    });

    test('custom props with description', () => {
        const child = s.object({
            props: { name: s.string() },
        });
        const schema = s.object({
            props: { child: s.extend(child, { description: 'The child of the person' }) },
        });

        const resolver = createTypeResolver();
        resolver.add('Child', child);

        const code = renderTypeInline(schema, { typeResolver: resolver });

        expect(code).toEqual('{\n  /** The child of the person */\n  child: Child;\n}');
    });

    test('custom array props', () => {
        const child = s.object({
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

        const resolver = createTypeResolver();
        resolver.add('Child', child);

        const code = renderTypeInline(parent, { typeResolver: resolver });

        expect(code).toEqual('{\n  /** The children of the person */\n  children: Child[];\n}');
    });
});

describe('array', () => {
    test('string array', () => {
        const schema = s.array(s.string());
        const code = renderTypeInline(schema);

        expect(code).toEqual('string[]');
    });

    test('object array', () => {
        const schema = s.array(s.object({ props: { name: s.string() } }));
        const code = renderTypeInline(schema);

        expect(code).toEqual('{\n  name: string;\n}[]');
    });
});

describe('union', () => {
    test('basic', () => {
        const schema = s.union([s.string(), s.number()]);
        const code = renderTypeInline(schema);

        expect(code).toEqual('string | number');
    });

    test('nullable', () => {
        const schema = s.union([s.string(), s.number()]);
        const code = renderTypeInline(s.nullable(schema));

        expect(code).toEqual('string | number | null');
    });

    test('optional', () => {
        const schema = s.union([s.string(), s.number()]);
        const code = renderTypeInline(s.optional(schema));

        expect(code).toEqual('string | number | undefined');
    });

    test('nullable and optional', () => {
        const schema = s.union([s.string(), s.number()]);
        const code = renderTypeInline(s.nullable(s.optional(schema)));

        expect(code).toEqual('string | number | null | undefined');
    });

    test('object', () => {
        const schema = s.union([
            s.object({ props: { name: s.string() } }),
            s.object({ props: { age: s.number() } }),
        ]);
        const code = renderTypeInline(schema);

        expect(code).toEqual('{\n  name: string;\n} | {\n  age: number;\n}');
    });

    test('named object', () => {
        const user = s.object({ props: { name: s.string() } });
        const resolver = createTypeResolver();
        resolver.add('User', user);

        const schema = s.union([user, s.object({ props: { age: s.number() } })]);
        const code = renderTypeInline(schema, { typeResolver: resolver });

        expect(code).toEqual('User | {\n  age: number;\n}');
    });

    test('array', () => {
        const schema = s.union([s.array(s.string()), s.array(s.number())]);
        const code = renderTypeInline(schema);

        expect(code).toEqual('string[] | number[]');
    });

    test('array of unions', () => {
        const schema = s.array(s.union([s.string(), s.number()]));
        const code = renderTypeInline(schema);

        expect(code).toEqual('(string | number)[]');
    });
});
