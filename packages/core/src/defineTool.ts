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
export type ToolOptions<
    TInput extends ToolInputOptions,
    TOutput extends s.Schema,
    TState extends ToolInputOptions,
> = {
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
     * Schema of the state of the tool.
     */
    state?: TState;
    /**
     * Handler for the tool.
     */
    handler: ToolHandler<
        s.Infer<ToolInputSchemaFromOptions<TInput>>,
        s.Infer<TOutput>,
        s.Infer<ToolInputSchemaFromOptions<TState>>
    >;
};

/**
 * Tool definition.
 */
export type ToolDefinition<
    TInput extends ToolInputSchema = ToolInputSchema,
    TOutput extends s.Schema = s.SchemaAny,
    TState extends ToolInputSchema = ToolInputSchema,
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
     * Schema of the state of the tool.
     */
    state: TState;
    /**
     * Handler for the tool.
     */
    handler: ToolHandler<s.Infer<TInput>, s.Infer<TOutput>, s.Infer<TState>>;
    /**
     * Symbol to indicate that the value is a tool.
     * @internal
     */
    [TOOL_SYMBOL]: true;
};

/**
 * Parameters for the tool handler.
 */
export type ToolContext<TInput, TState> = {
    /**
     * Resolved arguments for the tool.
     * First you need to define the input schema in {@link defineTool} options.
     */
    input: TInput;
    /**
     * State of the tool.
     */
    state: TState;
};

/**
 * Handler for the tool.
 */
export type ToolHandler<TInput, TOutput, TState> = (
    ctx: ToolContext<TInput, TState>,
) => TOutput | Promise<TOutput>;

/**
 * Define a tool.
 * @param options - Options for the tool.
 * @returns Defined tool.
 */
export function defineTool<
    TInput extends ToolInputOptions = undefined,
    TOutput extends s.Schema = s.VoidSchema,
    TState extends ToolInputOptions = undefined,
>(
    options: ToolOptions<TInput, TOutput, TState>,
): ToolDefinition<ToolInputSchemaFromOptions<TInput>, TOutput, ToolInputSchemaFromOptions<TState>> {
    let input: ToolInputSchemaFromOptions<TInput>;
    let singleArg = false;

    if (!options.input) {
        input = s.void() as ToolInputSchemaFromOptions<TInput>;
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

    let state: ToolInputSchemaFromOptions<TState>;
    if (!options.state) {
        state = s.void() as ToolInputSchemaFromOptions<TState>;
    } else if (s.isSchema(options.state, s.object)) {
        if (options.state.nullable || options.state.optional) {
            throw new Error('State schema must not be nullable or optional');
        }

        state = options.state as ToolInputSchemaFromOptions<TState>;
    } else {
        state = s.object({ props: options.state }) as ToolInputSchemaFromOptions<TState>;
    }

    return {
        description: options.description,
        input,
        singleArg,
        output: options.output ?? (s.void() as TOutput),
        state,
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
