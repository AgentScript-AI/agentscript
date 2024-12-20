import { expect, test, describe } from 'vitest';
import * as z from 'zod';

import { renderType } from './renderType.js';
import { createTypeResolver } from './typeResolver.js';

test('string', () => {
    const schema = z.string();
    const code = renderType(schema);

    expect(code).toEqual('string');
});

test('number', () => {
    const schema = z.number();
    const code = renderType(schema);

    expect(code).toEqual('number');
});

test('boolean', () => {
    const schema = z.boolean();
    const code = renderType(schema);

    expect(code).toEqual('boolean');
});

test('date', () => {
    const schema = z.date();
    const code = renderType(schema);

    expect(code).toEqual('Date');
});

test('custom type', () => {
    const schema = z.object({ name: z.string() });
    const resolver = createTypeResolver();
    resolver.add('Foo', schema);
    const code = renderType(schema, { typeResolver: resolver });

    expect(code).toEqual('Foo');
});

test('custom type nullable', () => {
    const schema = z.object({ name: z.string() });
    const resolver = createTypeResolver();
    resolver.add('Foo', schema);

    const code = renderType(schema.nullable(), { typeResolver: resolver });

    expect(code).toEqual('Foo | null');
});

test('string nullable', () => {
    const schema = z.string().nullable();
    const code = renderType(schema);

    expect(code).toEqual('string | null');
});

test('string optional', () => {
    const schema = z.string().optional();
    const code = renderType(schema);

    expect(code).toEqual('string | undefined');
});

test('string nullable and optional', () => {
    const schema = z.string().nullable().optional();
    const code = renderType(schema);

    expect(code).toEqual('string | null | undefined');
});

describe('object', () => {
    test('basic', () => {
        const schema = z.object({ name: z.string() });
        const code = renderType(schema);

        expect(code).toEqual('{\n  name: string;\n}');
    });

    test('nullable', () => {
        const schema = z.object({ name: z.string() }).nullable();
        const code = renderType(schema);

        expect(code).toEqual('{\n  name: string;\n} | null');
    });

    test('optional', () => {
        const schema = z.object({ name: z.string() }).optional();
        const code = renderType(schema);

        expect(code).toEqual('{\n  name: string;\n} | undefined');
    });

    test('nullable and optional', () => {
        const schema = z.object({ name: z.string() }).nullable().optional();
        const code = renderType(schema);

        expect(code).toEqual('{\n  name: string;\n} | null | undefined');
    });

    test('multiple properties', () => {
        const schema = z.object({
            name: z.string(),
            email: z.string().email().nullable(),
            age: z.number().optional(),
            birthDate: z.date().optional(),
            isActive: z.boolean().optional().nullable(),
        });
        const code = renderType(schema);

        expect(code).toEqual(
            '{\n  name: string;\n  email: string | null;\n  age?: number;\n  birthDate?: Date;\n  isActive?: boolean | null;\n}',
        );
    });

    test('custom props', () => {
        const child = z.object({ name: z.string() });
        const schema = z.object({ child });

        const resolver = createTypeResolver();
        resolver.add('Child', child);

        const code = renderType(schema, { typeResolver: resolver });

        expect(code).toEqual('{\n  child: Child;\n}');
    });

    test('custom nullable props', () => {
        const child = z.object({ name: z.string() });
        const schema = z.object({ child: child.nullable() });

        const resolver = createTypeResolver();
        resolver.add('Child', child);

        const code = renderType(schema, { typeResolver: resolver });

        expect(code).toEqual('{\n  child: Child | null;\n}');
    });

    test('custom optional props', () => {
        const child = z.object({ name: z.string() });
        const schema = z.object({ child: child.optional() });

        const resolver = createTypeResolver();
        resolver.add('Child', child);

        const code = renderType(schema, { typeResolver: resolver });

        expect(code).toEqual('{\n  child?: Child;\n}');
    });

    test('props with description', () => {
        const schema = z.object({
            name: z.string().describe('The name of the person'),
            age: z.number().optional().describe('The age of the person'),
        });
        const code = renderType(schema);

        expect(code).toEqual(
            '{\n  /** The name of the person */\n  name: string;\n  /** The age of the person */\n  age?: number;\n}',
        );
    });

    test('custom props with description', () => {
        const child = z.object({ name: z.string() });
        const schema = z.object({ child: child.describe('The child of the person') });

        const resolver = createTypeResolver();
        resolver.add('Child', child);

        const code = renderType(schema, { typeResolver: resolver });

        expect(code).toEqual('{\n  /** The child of the person */\n  child: Child;\n}');
    });

    test('custom array props', () => {
        const child = z.object({ name: z.string() });
        const parent = z.object({
            children: z.array(child).describe('The children of the person'),
        });

        const resolver = createTypeResolver();
        resolver.add('Child', child);

        const code = renderType(parent, { typeResolver: resolver });

        expect(code).toEqual('{\n  /** The children of the person */\n  children: Child[];\n}');
    });
});

test('string array', () => {
    const schema = z.array(z.string());
    const code = renderType(schema);

    expect(code).toEqual('string[]');
});

test('object array', () => {
    const schema = z.array(z.object({ name: z.string() }));
    const code = renderType(schema);

    expect(code).toEqual('{\n  name: string;\n}[]');
});

test('nested object', () => {
    const schema = z.object({ user: z.object({ name: z.string() }) });
    const code = renderType(schema);

    expect(code).toEqual('{\n  user: {\n    name: string;\n  };\n}');
});
