import type { z } from 'zod';

export type TypeResolver = ReturnType<typeof createTypeResolver>;

export function createTypeResolver() {
    const lookup = new Map<object, string>();

    return { resolve, add };

    function resolve(schema: z.AnyZodObject) {
        return lookup.get(schema.shape as object);
    }

    function add(name: string, schema: z.AnyZodObject) {
        lookup.set(schema.shape as object, name);
    }
}
