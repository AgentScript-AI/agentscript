import type * as s from '@agentscript/schema';

export type TypeResolver = ReturnType<typeof createTypeResolver>;

export function createTypeResolver() {
    const lookup = new Map<s.SchemaProto, string>();

    return { resolve, add };

    function resolve(schema: s.ObjectSchema) {
        return lookup.get(schema.proto);
    }

    function add(name: string, schema: s.ObjectSchema) {
        lookup.set(schema.proto, name);
    }
}
