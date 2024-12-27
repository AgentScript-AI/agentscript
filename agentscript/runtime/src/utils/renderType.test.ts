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

test('void', () => {
    const schema = z.void();
    const code = renderType(schema);

    expect(code).toEqual('void');
});

test('unknown', () => {
    const schema = z.unknown();
    const code = renderType(schema);

    expect(code).toEqual('unknown');
});

test('any', () => {
    const schema = z.any();
    const code = renderType(schema);

    expect(code).toEqual('any');
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

    test('nested object', () => {
        const schema = z.object({ user: z.object({ name: z.string() }) });
        const code = renderType(schema);

        expect(code).toEqual('{\n  user: {\n    name: string;\n  };\n}');
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

describe('array', () => {
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
});

describe('union', () => {
    test('basic', () => {
        const schema = z.union([z.string(), z.number()]);
        const code = renderType(schema);

        expect(code).toEqual('string | number');
    });

    test('nullable', () => {
        const schema = z.union([z.string(), z.number()]).nullable();
        const code = renderType(schema);

        expect(code).toEqual('string | number | null');
    });

    test('optional', () => {
        const schema = z.union([z.string(), z.number()]).optional();
        const code = renderType(schema);

        expect(code).toEqual('string | number | undefined');
    });

    test('nullable and optional', () => {
        const schema = z.union([z.string(), z.number()]).nullable().optional();
        const code = renderType(schema);

        expect(code).toEqual('string | number | null | undefined');
    });

    test('object', () => {
        const schema = z.union([z.object({ name: z.string() }), z.object({ age: z.number() })]);
        const code = renderType(schema);

        expect(code).toEqual('{\n  name: string;\n} | {\n  age: number;\n}');
    });

    test('named object', () => {
        const user = z.object({ name: z.string() });
        const resolver = createTypeResolver();
        resolver.add('User', user);

        const schema = z.union([user, z.object({ age: z.number() })]);
        const code = renderType(schema, { typeResolver: resolver });

        expect(code).toEqual('User | {\n  age: number;\n}');
    });

    test('array', () => {
        const schema = z.union([z.array(z.string()), z.array(z.number())]);
        const code = renderType(schema);

        expect(code).toEqual('string[] | number[]');
    });

    test('array of unions', () => {
        const schema = z.array(z.union([z.string(), z.number()]));
        const code = renderType(schema);

        expect(code).toEqual('(string | number)[]');
    });
});
