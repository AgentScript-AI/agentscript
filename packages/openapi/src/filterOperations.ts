import type { OpenAPIV3 } from 'openapi-types';

const methods = ['get', 'post', 'put', 'delete', 'patch', 'options', 'head'] as const;
type HttpMethod = (typeof methods)[number];

/**
 * A predicate that filters the operations in the OpenAPI specification.
 */
export interface FilterOperationPredicate {
    (path: string, method: HttpMethod, operation: OpenAPIV3.OperationObject): boolean;
}

/**
 * Options for the filter operation.
 */
export interface FilterOperationOptions {
    /**
     * The paths to exclude from the specification.
     */
    exclude?: (string | RegExp)[];
    /**
     * The predicate to filter the operations.
     */
    predicate?: FilterOperationPredicate;
}

/**
 * Filters the operations in the OpenAPI specification.
 * @param spec - The OpenAPI specification.
 * @param options - The options for the filter operation.
 */
export function filterOperations(spec: OpenAPIV3.Document, options: FilterOperationOptions) {
    const paths = Object.keys(spec.paths);

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

            if (!checkPath(path, method, operation, options)) {
                delete pathItem[method];
                continue;
            }

            anyOperation = true;
        }

        if (!anyOperation) {
            delete spec.paths[path];
        }
    }
}

function checkPath(
    path: string,
    method: HttpMethod,
    operation: OpenAPIV3.OperationObject,
    options: FilterOperationOptions,
) {
    if (
        options.exclude &&
        options.exclude.some(exclude =>
            exclude instanceof RegExp ? exclude.test(path) : exclude === path,
        )
    ) {
        return false;
    }

    if (options.predicate && !options.predicate(path, method, operation)) {
        return false;
    }

    return true;
}
