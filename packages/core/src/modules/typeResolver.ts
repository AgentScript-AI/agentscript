import type * as s from '@agentscript-ai/schema';

/**
 * Type resolver.
 */
export type TypeResolver = ReturnType<typeof createTypeResolver>;

/**
 * Create a type resolver.
 * @returns Type resolver.
 */
export function createTypeResolver() {
    const bySchema = new Map<s.SchemaProto, string>();
    const byName = new Map<string, s.Schema>();

    return { getName, getSchema, add };

    function getName(schema: s.Schema) {
        return bySchema.get(schema.proto);
    }

    function getSchema(name: string) {
        return byName.get(name);
    }

    function add(name: string, schema: s.Schema) {
        bySchema.set(schema.proto, name);
        byName.set(name, schema);
    }
}
