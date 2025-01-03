import type { EmptyObject } from '@nzyme/types';

import * as s from '@agentscript-ai/schema';

const TOOL_SYMBOL = Symbol('tool');

type ToolInputOptions = s.ObjectSchemaProps | s.NonNullish<s.ObjectSchema>;

type ToolInputSchema<TIn extends ToolInputOptions> =
    TIn extends s.NonNullish<s.ObjectSchema>
        ? TIn
        : TIn extends s.ObjectSchemaProps
          ? s.ObjectSchema<{ props: TIn; nullable: false; optional: false }>
          : never;

type ToolInputValue<TIn extends ToolInputOptions> = TIn extends s.ObjectSchema
    ? s.Infer<TIn>
    : TIn extends s.ObjectSchemaProps
      ? s.ObjectSchemaProps extends TIn
          ? // eslint-disable-next-line @typescript-eslint/no-explicit-any
            any
          : s.ObjectSchemaPropsValue<TIn>
      : never;

/**
 * Options for {@link defineTool}.
 */
export type ToolOptions<TIn extends ToolInputOptions, TOut extends s.Schema> = {
    /**
     * Description of the tool.
     * Should be descriptive and concise, so that LLM can understand what the tool does.
     */
    description?: string | string[];
    /**
     * Arguments for the tool.
     */
    input?: TIn;
    /**
     * Schema of the return value of the tool.
     * @default s.void()
     */
    output?: TOut;
    /**
     * Additional types for the tool.
     * These types will be included in the runtime definition.
     */
    types?: Record<string, s.Schema>;
    /**
     * Handler for the tool.
     */
    handler: ToolHandler<TIn, TOut>;
};

/**
 * Tool definition.
 */
export type ToolDefinition<
    TIn extends s.NonNullish<s.ObjectSchema> = s.NonNullish<s.ObjectSchemaAny>,
    TOut extends s.Schema = s.SchemaAny,
> = {
    /**
     * Description of the tool.
     * Should be descriptive and concise, so that LLM can understand what the tool does.
     */
    description?: string | string[];
    /**
     * Arguments for the tool.
     */
    input: TIn;
    /**
     * Schema of the return value of the tool.
     */
    output: TOut;
    /**
     * Additional types for the tool.
     * These types will be included in the runtime definition.
     */
    types?: Record<string, s.Schema>;
    /**
     * Handler for the tool.
     */
    handler: ToolHandler<TIn, TOut>;
    /**
     * Symbol to indicate that the value is a tool.
     * @internal
     */
    [TOOL_SYMBOL]: true;
};

/**
 * Parameters for the tool handler.
 */
export type ToolHandlerParams<TIn extends ToolInputOptions> = {
    /**
     * Resolved arguments for the tool.
     */
    input: ToolInputValue<TIn>;
};

/**
 * Handler for the tool.
 */
export type ToolHandler<TIn extends ToolInputOptions, TOut extends s.Schema> = (
    params: ToolHandlerParams<TIn>,
) => s.Infer<TOut> | Promise<s.Infer<TOut>>;

/**
 * Define a tool.
 * @param options - Options for the tool.
 * @returns Defined tool.
 */
export function defineTool<
    TIn extends ToolInputOptions = EmptyObject,
    TOut extends s.Schema = s.Schema<void>,
>(options: ToolOptions<TIn, TOut>): ToolDefinition<ToolInputSchema<TIn>, TOut> {
    let input: ToolInputSchema<TIn>;

    if (!options.input) {
        input = s.object({ props: {} }) as ToolInputSchema<TIn>;
    } else if (s.isSchema(options.input, s.object)) {
        if (options.input.nullable || options.input.optional) {
            throw new Error('Input schema must not be nullable or optional');
        }

        input = options.input as ToolInputSchema<TIn>;
    } else {
        input = s.object({ props: options.input }) as ToolInputSchema<TIn>;
    }

    return {
        description: options.description,
        input,
        output: options.output ?? (s.void() as TOut),
        types: options.types,
        handler: options.handler as ToolHandler<ToolInputSchema<TIn>, TOut>,
        [TOOL_SYMBOL]: true,
    };
}

/**
 * Check if a value is a tool.
 * @param value - Value to check.
 * @returns Whether the value is a tool.
 */
export function isTool(value: unknown): value is ToolDefinition {
    return typeof value === 'object' && value !== null && TOOL_SYMBOL in value;
}
