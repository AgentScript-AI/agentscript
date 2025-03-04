import type { OpenAPIV3 } from 'openapi-types';

/**
 * Checks if the given schema is a reference object.
 * @param schema - The schema to check.
 * @returns True if the schema is a reference object, false otherwise.
 */
export function isReferenceObject<T>(
    schema: T | OpenAPIV3.ReferenceObject,
): schema is OpenAPIV3.ReferenceObject {
    return '$ref' in (schema as object);
}
