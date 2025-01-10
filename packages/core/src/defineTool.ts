import * as s from '@agentscript-ai/schema';

const TOOL_SYMBOL = Symbol('tool');

type ToolInputSchema = s.NonNullish<s.ObjectSchema> | s.VoidSchema;
type ToolInputOptions = s.ObjectSchemaProps | s.NonNullish<s.ObjectSchema> | undefined;

type ToolInputSchemaFromOptions<TIn extends ToolInputOptions = ToolInputOptions> =
    TIn extends s.NonNullish<s.ObjectSchema>
        ? TIn
        : TIn extends s.ObjectSchemaProps
          ? s.ObjectSchema<{ props: TIn; nullable: false; optional: false }>
          : s.VoidSchema;

/**
 * Options for {@link defineTool}.
 */
export type ToolOptions<TInput extends ToolInputOptions, TOutput extends s.Schema> = {
    /**
     * Description of the tool.
     * Should be descriptive and concise, so that LLM can understand what the tool does.
     */
    description?: string | string[];
    /**
     * Arguments for the tool.
     */
    input?: TInput;
    /**
     * Schema of the return value of the tool.
     * @default s.void()
     */
    output?: TOutput;

    /**
     * Handler for the tool.
     */
    handler: ToolHandler<ToolInputSchemaFromOptions<TInput>, TOutput>;
};

/**
 * Tool definition.
 */
export type ToolDefinition<
    TInput extends ToolInputSchema = ToolInputSchema,
    TOutput extends s.Schema = s.SchemaAny,
> = {
    /**
     * Description of the tool.
     * Should be descriptive and concise, so that LLM can understand what the tool does.
     */
    description?: string | string[];
    /**
     * Arguments for the tool.
     */
    input: TInput;
    /**
     * Whether the tool has a single argument.
     */
    singleArg: boolean;
    /**
     * Schema of the return value of the tool.
     */
    output: TOutput;
    /**
     * Handler for the tool.
     */
    handler: ToolHandler<TInput, TOutput>;
    /**
     * Symbol to indicate that the value is a tool.
     * @internal
     */
    [TOOL_SYMBOL]: true;
};

/**
 * Parameters for the tool handler.
 */
export type ToolContext<TIn extends s.Schema> = {
    /**
     * Resolved arguments for the tool.
     */
    input: s.Infer<TIn>;
};

/**
 * Handler for the tool.
 */
export type ToolHandler<TIn extends s.Schema, TOut extends s.Schema> = (
    params: ToolContext<TIn>,
) => s.Infer<TOut> | Promise<s.Infer<TOut>>;

/**
 * Define a tool.
 * @param options - Options for the tool.
 * @returns Defined tool.
 */
export function defineTool<
    TInput extends ToolInputOptions = undefined,
    TOutput extends s.Schema = s.VoidSchema,
>(
    options: ToolOptions<TInput, TOutput>,
): ToolDefinition<ToolInputSchemaFromOptions<TInput>, TOutput> {
    let input: ToolInputSchemaFromOptions<TInput>;
    let singleArg = false;

    if (!options.input) {
        input = s.object({ props: {} }) as ToolInputSchemaFromOptions<TInput>;
    } else if (s.isSchema(options.input, s.object)) {
        if (options.input.nullable || options.input.optional) {
            throw new Error('Input schema must not be nullable or optional');
        }

        input = options.input as ToolInputSchemaFromOptions<TInput>;
        // if a full schema is provided, we assume it's a single argument
        singleArg = true;
    } else {
        input = s.object({ props: options.input }) as ToolInputSchemaFromOptions<TInput>;
        // make the tool singleArg if there are more than 2 arguments
        singleArg = Object.keys(options.input).length > 2;
    }

    return {
        description: options.description,
        input,
        singleArg,
        output: options.output ?? (s.void() as TOutput),
        handler: options.handler,
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
