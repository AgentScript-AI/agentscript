import type { OpenAPIV3 } from 'openapi-types';

import { isReferenceObject } from './utils/isReferenceObject.js';
import { resolveReferenceObject } from './utils/resolveReferenceObject.js';

const methods = ['get', 'post', 'put', 'delete', 'patch', 'options', 'head'] as const;
type HttpMethod = (typeof methods)[number];

/**
 * AFunction that returns true if the operation should be excluded.
 */
export interface FilterExcludeOperationFunction {
    (path: string, method: HttpMethod, operation: OpenAPIV3.OperationObject): boolean | undefined;
}

/**
 * A function that returns true if the operation parameter should be excluded.
 */
export interface FilterExcludeOperationParameterFunction {
    (
        parameter: OpenAPIV3.ParameterObject,
        operationPath: string,
        operationMethod: HttpMethod,
        operation: OpenAPIV3.OperationObject,
    ): boolean | undefined;
}
/**
 * A function that returns true if the type should be excluded.
 */
export interface FilterExcludeSchemaFunction {
    (typeName: string, typeSchema: OpenAPIV3.SchemaObject): boolean | undefined;
}

/**
 * A function that returns true if the property should be excluded.
 */
export interface FilterExcludeSchemaPropertyFunction {
    (
        propertyName: string,
        propertySchema: OpenAPIV3.SchemaObject,
        typeName: string,
        typeSchema: OpenAPIV3.SchemaObject,
    ): boolean | undefined;
}

/**
 * Options for the filter operation.
 */
export interface FilterOperationOptions {
    /**
     * The specification to filter.
     */
    spec: OpenAPIV3.Document;

    /**
     * Function that returns true if the operation should be excluded or an array of paths to exclude.
     */
    excludeOperations?: FilterExcludeOperationFunction | (string | RegExp)[];

    /**
     * Function that returns true if the operation parameter should be excluded.
     */
    excludeOperationParameters?: FilterExcludeOperationParameterFunction;

    /**
     * Function that returns true if the type should be excluded.
     */
    excludeSchemas?: FilterExcludeSchemaFunction | (string | RegExp)[];

    /**
     * Function that returns true if the property should be excluded.
     */
    excludeSchemaProperties?: FilterExcludeSchemaPropertyFunction | (string | RegExp)[];
}

/**
 * Filters the operations in the OpenAPI specification.
 * @param options - The options for the filter operation.
 */
export function filterOpenApiDoc(options: FilterOperationOptions) {
    const spec = options.spec;

    const excludeOperations = makeExcludeFunction(options.excludeOperations);
    const excludeOperationParameters = options.excludeOperationParameters;
    const excludeSchemas = makeExcludeFunction(options.excludeSchemas);
    const excludeSchemaProperties = makeExcludeFunction(options.excludeSchemaProperties);

    const paths = Object.keys(spec.paths);

    // filter types
    for (const typeName of Object.keys(spec.components?.schemas ?? {})) {
        const typeSchema = spec.components?.schemas?.[typeName];
        if (!typeSchema) {
            continue;
        }

        if (isReferenceObject(typeSchema)) {
            continue;
        }

        if (excludeSchemas(typeName, typeSchema)) {
            delete spec.components?.schemas?.[typeName];
        }

        // filter properties
        filterSchemaProperties(spec, typeName, typeSchema, excludeSchemaProperties);
    }

    // filter operations
    for (const path of paths) {
        const pathItem = spec.paths[path];
        if (!pathItem) {
            continue;
        }

        let anyOperation = false;

        for (const method of methods) {
            const operation = pathItem[method];
            if (!operation) {
                continue;
            }

            if (excludeOperations(path, method, operation)) {
                delete pathItem[method];
                continue;
            }

            // filter parameters
            const parameters = operation.parameters;
            if (parameters && excludeOperationParameters) {
                for (let i = 0; i < parameters.length; i++) {
                    const parameter = parameters[i]!;
                    const exclude = excludeOperationParameters(
                        parameter as OpenAPIV3.ParameterObject,
                        path,
                        method,
                        operation,
                    );

                    if (exclude) {
                        parameters.splice(i, 1);
                    }
                }
            }

            anyOperation = true;
        }

        if (!anyOperation) {
            delete spec.paths[path];
        }
    }
}

function filterSchemaProperties(
    spec: OpenAPIV3.Document,
    typeName: string,
    typeSchema: OpenAPIV3.SchemaObject,
    excludeProperties: FilterExcludeSchemaPropertyFunction,
) {
    if (!typeSchema.properties) {
        return;
    }

    for (const propertyName of Object.keys(typeSchema.properties)) {
        let propertySchema = typeSchema.properties?.[propertyName];
        if (!propertySchema) {
            continue;
        }

        let isReference = false;
        if (isReferenceObject(propertySchema)) {
            isReference = true;
            const ref = resolveReferenceObject(spec, propertySchema);
            if (!ref) {
                delete typeSchema.properties[propertyName];
                continue;
            }

            propertySchema = ref.schema;
        }

        if (excludeProperties(propertyName, propertySchema, typeName, typeSchema)) {
            delete typeSchema.properties[propertyName];
        }

        if (!isReference) {
            filterSchemaProperties(spec, propertyName, propertySchema, excludeProperties);
        }
    }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function makeExcludeFunction<F extends (name: string, ...args: any[]) => boolean | undefined>(
    exclude: F | (string | RegExp)[] | undefined,
): F {
    if (!exclude) {
        return ((_name: string) => false) as F;
    }

    if (typeof exclude === 'function') {
        return exclude;
    }

    return ((name: string) => exclude.some(exclude => isExcludedName(name, exclude))) as F;
}

function isExcludedName(name: string, exclude: string | RegExp) {
    return exclude instanceof RegExp ? exclude.test(name) : exclude === name;
}
