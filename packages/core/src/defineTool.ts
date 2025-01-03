import * as s from '@agentscript.ai/schema';

const TOOL_SYMBOL = Symbol('tool');

/**
 * Options for {@link defineTool}.
 */
export type ToolOptions<TArgs extends s.ObjectSchemaProps, TReturn extends s.Schema> = {
    /**
     * Description of the tool.
     * Should be descriptive and concise, so that LLM can understand what the tool does.
     */
    description?: string | string[];
    /**
     * Arguments for the tool.
     */
    args?: TArgs;
    /**
     * Schema of the return value of the tool.
     * @default s.void()
     */
    return?: TReturn;
    /**
     * Additional types for the tool.
     * These types will be included in the runtime definition.
     */
    types?: Record<string, s.Schema>;
    /**
     * Handler for the tool.
     */
    handler: ToolHandler<TArgs, TReturn>;
};

/**
 * Resolved arguments for the tool.
 */
export type ToolArgs<TArgs extends s.ObjectSchemaProps> = s.ObjectSchemaProps extends TArgs
    ? // eslint-disable-next-line @typescript-eslint/no-explicit-any
      any
    : s.ObjectSchemaPropsValue<TArgs>;

/**
 * Tool definition.
 */
export type ToolDefinition<
    TArgs extends s.ObjectSchemaProps = s.ObjectSchemaProps,
    TReturn extends s.Schema = s.SchemaAny,
> = {
    /**
     * Description of the tool.
     * Should be descriptive and concise, so that LLM can understand what the tool does.
     */
    description?: string | string[];
    /**
     * Arguments for the tool.
     */
    args: s.ObjectSchema<{ props: TArgs }>;
    /**
     * Schema of the return value of the tool.
     */
    return: TReturn;
    /**
     * Additional types for the tool.
     * These types will be included in the runtime definition.
     */
    types?: Record<string, s.Schema>;
    /**
     * Handler for the tool.
     */
    handler: ToolHandler<TArgs, TReturn>;
    /**
     * Symbol to indicate that the value is a tool.
     * @internal
     */
    [TOOL_SYMBOL]: true;
};

/**
 * Parameters for the tool handler.
 */
export type ToolHandlerParams<TArgs extends s.ObjectSchemaProps> = {
    /**
     * Resolved arguments for the tool.
     */
    args: ToolArgs<TArgs>;
};

/**
 * Handler for the tool.
 */
export type ToolHandler<TArgs extends s.ObjectSchemaProps, TReturn extends s.Schema> = (
    params: ToolHandlerParams<TArgs>,
) => s.Infer<TReturn> | Promise<s.Infer<TReturn>>;

/**
 * Define a tool.
 * @param options - Options for the tool.
 * @returns Defined tool.
 */
export function defineTool<
    TArgs extends s.ObjectSchemaProps = s.ObjectSchemaProps,
    TReturn extends s.Schema = s.Schema<void>,
>(options: ToolOptions<TArgs, TReturn>): ToolDefinition<TArgs, TReturn> {
    return {
        description: options.description,
        args: s.object({ props: options.args ?? {} }) as ToolDefinition<TArgs, TReturn>['args'],
        return: options.return ?? (s.void() as TReturn),
        types: options.types,
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
