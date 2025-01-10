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
     * Whether the tool has a single argument.
     */
    singleArg: boolean;
    /**
     * Schema of the return value of the tool.
     */
    output: TOut;
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
    let singleArg = false;

    if (!options.input) {
        input = s.object({ props: {} }) as ToolInputSchema<TIn>;
    } else if (s.isSchema(options.input, s.object)) {
        if (options.input.nullable || options.input.optional) {
            throw new Error('Input schema must not be nullable or optional');
        }

        input = options.input as ToolInputSchema<TIn>;
        // if a full schema is provided, we assume it's a single argument
        singleArg = true;
    } else {
        input = s.object({ props: options.input }) as ToolInputSchema<TIn>;
        // make the tool singleArg if there are more than 2 arguments
        singleArg = Object.keys(options.input).length > 2;
    }

    return {
        description: options.description,
        input,
        singleArg,
        output: options.output ?? (s.void() as TOut),
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
