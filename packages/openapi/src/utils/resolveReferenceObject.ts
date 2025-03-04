import type { OpenAPIV3 } from 'openapi-types';

/**
 * Resolves a reference object to a schema.
 * @param spec - The OpenAPI specification.
 * @param ref - The reference object to resolve.
 * @returns The resolved schema and name.
 */
export function resolveReferenceObject(spec: OpenAPIV3.Document, ref: OpenAPIV3.ReferenceObject) {
    const path = ref.$ref?.split('/');
    if (!path) {
        return null;
    }

    let current = spec as unknown as Record<string, unknown> | undefined;

    for (const part of path) {
        if (part === '#') {
            continue;
        }

        current = current?.[part] as Record<string, unknown>;
    }

    if (!current) {
        return null;
    }

    return {
        schema: current,
        name: path[path.length - 1]!,
    };
}
