import { assert, mapObject, toCamelCase, toPascalCase } from '@nzyme/utils';
import type { OpenAPIV3 } from 'openapi-types';
import type { QueryObject } from 'ufo';
import { joinURL, withQuery } from 'ufo';

import { type ToolDefinition, defineTool } from '@agentscript-ai/core';
import * as s from '@agentscript-ai/schema';

import { isReferenceObject } from './utils/isReferenceObject.js';
import { resolveReferenceObject } from './utils/resolveReferenceObject.js';

const methods = ['get', 'post', 'put', 'delete', 'patch', 'options', 'head'] as const;

type HttpMethod = (typeof methods)[number];
type SchemaParam = OpenAPIV3.SchemaObject | OpenAPIV3.ReferenceObject;
type Request = RequestInit & { path: string; query: QueryObject; headers: Record<string, string> };
type RequestHandler = (input: Record<string, unknown>, request: Request) => void;
type ResponseHandler = (response: Response) => unknown;

declare module '@agentscript-ai/schema' {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    interface SchemaProps<V> {
        openapi?: SchemaParam;
    }
}

/**
 * Options for the `toolsFromOpenApi` function.
 */
export interface ToolFromOpenApiOptions {
    /**
     * The OpenAPI definition.
     */
    spec: OpenAPIV3.Document;
    /**
     * The base URL for the API.
     */
    baseUrl?: string;

    /**
     * The headers to be added to the request.
     */
    headers?: Record<string, string>;
}

/**
 * Creates tools from an OpenAPI definition.
 * @param options - The options for the `toolsFromOpenApi` function.
 * @returns The tools.
 */
export function toolsFromOpenApi(options: ToolFromOpenApiOptions) {
    const spec = options.spec;
    const tools: Record<string, ToolDefinition> = {};
    const baseUrl = options.baseUrl || spec.servers?.[0]?.url;

    assert(baseUrl, 'No base URL found in OpenAPI definition');

    const ctx: OpenApiToolContext = {
        spec,
        types: {},
        baseUrl,
        headers: options.headers || {},
    };

    for (const path in spec.paths) {
        const pathItem = spec.paths[path]!;

        for (const method of methods) {
            const operation = pathItem[method];
            if (!operation || !operation.operationId) {
                continue;
            }

            const tool = getToolFromOperation(ctx, method, path, operation);
            if (tool) {
                const toolName = toCamelCase(operation.operationId);
                tools[toolName] = tool;
            }
        }
    }

    return tools;
}

interface OpenApiToolContext {
    spec: OpenAPIV3.Document;
    types: Record<string, s.Schema | undefined>;
    baseUrl: string;
    headers: Record<string, string>;
}

interface OpenApiToolDefinition {
    input: Record<string, s.Schema>;
    output: s.Schema | undefined;
    request: RequestHandler[];
    response: ResponseHandler | undefined;
}

function getToolFromOperation(
    ctx: OpenApiToolContext,
    method: HttpMethod,
    path: string,
    operation: OpenAPIV3.OperationObject,
) {
    const definition: OpenApiToolDefinition = {
        input: {},
        output: undefined,
        request: [],
        response: undefined,
    };

    if (!addOperationParameters(ctx, method, operation, definition)) {
        return;
    }

    if (!addOperationBody(ctx, method, operation, definition)) {
        return;
    }

    addOperationResponse(ctx, operation, definition);

    return defineTool({
        description: operation.summary || operation.description,
        input: definition.input,
        output: definition.output,
        transformInput: transformInput,
        handler: async ({ input }) => {
            const request: Request = {
                method,
                path,
                query: {},
                headers: {
                    ...ctx.headers,
                },
            };

            for (const handler of definition.request) {
                handler(input, request);
            }

            const url = withQuery(joinURL(ctx.baseUrl, request.path), request.query);
            const response = await fetch(url, {
                method: method.toUpperCase(),
                body: request.body,
                headers: request.headers,
            });

            if (!response.ok) {
                const text = await response.text();
                throw new Error(`HTTP ${response.status} ${response.statusText}: ${text}`);
            }

            const result = await definition.response?.(response);
            return result;
        },
    });
}

function addOperationParameters(
    ctx: OpenApiToolContext,
    method: HttpMethod,
    operation: OpenAPIV3.OperationObject,
    definition: OpenApiToolDefinition,
): boolean {
    if (!operation.parameters) {
        return true;
    }

    for (const param of operation.parameters) {
        if (isReferenceObject(param)) {
            console.warn('Reference parameters are not supported', operation);
            return false;
        }

        const paramName = param.name;
        const paramSchema = s.extend(getSchema(ctx, param.schema), {
            description: param.description,
            optional: !param.required,
        });

        definition.input[paramName] = paramSchema;
        definition.request.push((input, request) => {
            switch (param.in) {
                case 'query': {
                    const value = input[paramName];
                    if (value != null) {
                        request.query[paramName] = value;
                    }
                    break;
                }
                case 'path':
                    request.path = request.path.replace(
                        `{${param.name}}`,
                        String(input[param.name]),
                    );
                    break;
            }
        });
    }

    return true;
}

function addOperationBody(
    ctx: OpenApiToolContext,
    method: HttpMethod,
    operation: OpenAPIV3.OperationObject,
    definition: OpenApiToolDefinition,
): boolean {
    if (!operation.requestBody) {
        return true;
    }

    const requestBody = operation.requestBody;
    if (isReferenceObject(requestBody)) {
        console.warn('Reference request bodies are not supported', operation);
        return false;
    }

    const content =
        requestBody.content['application/json'] ??
        requestBody.content['text/json'] ??
        requestBody.content['text/plain'] ??
        requestBody.content['*/*'];

    if (!content) {
        console.warn('No supported content type found in request body', operation);
        return false;
    }

    const schema = s.extend(getSchema(ctx, content.schema), {
        description: requestBody.description,
        optional: !requestBody.required,
    });

    const key = findUniqueKey(definition.input, ['data', 'payload', 'body', 'params']);

    definition.input[key] = schema;
    definition.request.push((input, request) => {
        const body = input[key];

        request.body = s.toJson(body);
        request.headers['Content-Type'] = 'application/json';
    });

    return true;
}

function addOperationResponse(
    ctx: OpenApiToolContext,
    operation: OpenAPIV3.OperationObject,
    definition: OpenApiToolDefinition,
) {
    if (!operation.responses) {
        return;
    }

    const successResponse = operation.responses['200'];
    if (!successResponse) {
        return;
    }

    if (isReferenceObject(successResponse)) {
        console.warn('Reference responses are not supported', operation);
        return;
    }

    const successContent = successResponse.content;
    if (!successContent) {
        return;
    }

    const content =
        successContent['application/json'] ??
        successContent['text/json'] ??
        successContent['text/plain'] ??
        successContent['*/*'];

    if (!content) {
        console.warn('No supported content type found in response', operation);
        return;
    }

    const output = getSchema(ctx, content.schema);
    definition.output = output;
    definition.request.push((_input, request) => {
        request.headers['Accept'] = 'application/json';
    });
    definition.response = async response => {
        if (response.status === 204) {
            return;
        }

        const json = await response.json();
        const result = s.coerce(output, json);
        return result;
    };
}

function getSchema(ctx: OpenApiToolContext, schema: SchemaParam | null | undefined): s.Schema {
    if (!schema) {
        return s.unknown();
    }

    if (isReferenceObject(schema)) {
        const ref = resolveReferenceObject(ctx.spec, schema);
        if (!ref) {
            return s.unknown({ openapi: schema });
        }

        const existing = ctx.types[ref.name];
        if (existing) {
            return existing;
        }

        const lazy = s.lazy(() => createSchema(ctx, ref.schema, ref.name));
        ctx.types[ref.name] = lazy;

        return lazy.of();
    }

    return createSchema(ctx, schema);
}

function createSchema(ctx: OpenApiToolContext, schema: OpenAPIV3.SchemaObject, name?: string) {
    if (schema.enum) {
        return s.enum({
            values: schema.enum,
            ...getSchemaProps(schema, name),
        });
    }

    switch (schema.type) {
        case 'boolean':
            return s.boolean(getSchemaProps(schema, name));

        case 'string':
            return s.string(getSchemaProps(schema, name));

        case 'number':
            return s.number(getSchemaProps(schema, name));

        case 'integer':
            if (schema.format === 'int64') {
                return s.bigint(getSchemaProps(schema, name));
            }

            return s.integer(getSchemaProps(schema, name));

        case 'object': {
            if (!schema.properties && schema.additionalProperties) {
                const valueSchema =
                    schema.additionalProperties === true
                        ? s.unknown()
                        : getSchema(ctx, schema.additionalProperties);

                return s.record({
                    of: valueSchema,
                    ...getSchemaProps(schema, name),
                });
            }

            if (!schema.properties) {
                return s.unknown({
                    ...getSchemaProps(schema, name),
                });
            }

            const props = schema.properties;

            return s.object({
                props: mapObject(props, (prop, key) => {
                    let propSchema = getSchema(ctx, prop as OpenAPIV3.SchemaObject);
                    if (!schema.required?.includes(key as string)) {
                        propSchema = s.optional(propSchema);
                    }

                    return propSchema;
                }),
                ...getSchemaProps(schema, name),
            });
        }

        case 'array':
            return s.array({
                of: schema.items ? getSchema(ctx, schema.items) : s.unknown(),
                ...getSchemaProps(schema, name),
            });
    }

    return s.unknown({ openapi: schema });
}

function getSchemaProps(schema: OpenAPIV3.SchemaObject, name?: string) {
    const props: s.SchemaOptionsBase & s.SchemaProps<unknown> = {
        nullable: schema.nullable,
        openapi: schema,
    };

    if (schema.description) {
        props.description = schema.description;
    }

    if (name) {
        props.name = toPascalCase(name);
    }

    return props;
}

function findUniqueKey(obj: Record<string, unknown>, keys: string[]) {
    for (const key of keys) {
        if (key in obj) {
            continue;
        }

        return key;
    }

    throw new Error('No unique key found in object');
}

function transformInput(input: Record<string, unknown>) {
    return input;
}
