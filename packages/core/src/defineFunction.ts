import * as s from '@agentscript.ai/schema';

const FUNCTION_SYMBOL = Symbol('function');

/**
 * Options for {@link defineFunction}.
 */
export type FunctionOptions<TArgs extends s.ObjectSchemaProps, TReturn extends s.Schema> = {
    /**
     * Description of the function.
     * Should be descriptive and concise, so that LLM can understand what the function does.
     */
    description?: string;
    /**
     * Arguments for the function.
     */
    args?: TArgs;
    /**
     * Schema of the return value of the function.
     * @default s.void()
     */
    return?: TReturn;
    /**
     * Additional types for the function.
     * These types will be included in the runtime definition.
     */
    types?: Record<string, s.Schema>;
    /**
     * Handler for the function.
     */
    handler: FunctionHandler<TArgs, TReturn>;
};

/**
 * Resolved arguments for the function.
 */
export type FunctionArgs<TArgs extends s.ObjectSchemaProps> = s.ObjectSchemaProps extends TArgs
    ? // eslint-disable-next-line @typescript-eslint/no-explicit-any
      any
    : s.ObjectSchemaPropsValue<TArgs>;

/**
 * Function definition.
 */
export type FunctionDefinition<
    TArgs extends s.ObjectSchemaProps = s.ObjectSchemaProps,
    TReturn extends s.Schema = s.SchemaAny,
> = {
    /**
     * Description of the function.
     * Should be descriptive and concise, so that LLM can understand what the function does.
     */
    description?: string | string[];
    /**
     * Arguments for the function
     */
    args: s.ObjectSchema<{ props: TArgs }>;
    /**
     * Schema of the return value of the function.
     */
    return: TReturn;
    /**
     * Additional types for the function.
     * These types will be included in the runtime definition.
     */
    types?: Record<string, s.Schema>;
    /**
     * Handler for the function.
     */
    handler: FunctionHandler<TArgs, TReturn>;
    /**
     * Symbol to indicate that the value is a function.
     * @internal
     */
    [FUNCTION_SYMBOL]: true;
};

/**
 * Parameters for the function handler.
 */
export type FunctionHandlerParams<TArgs extends s.ObjectSchemaProps> = {
    /**
     * Resolved arguments for the function.
     */
    args: FunctionArgs<TArgs>;
};

/**
 * Handler for the function.
 */
export type FunctionHandler<TArgs extends s.ObjectSchemaProps, TReturn extends s.Schema> = (
    params: FunctionHandlerParams<TArgs>,
) => s.SchemaValue<TReturn> | Promise<s.SchemaValue<TReturn>>;

/**
 * Define a function.
 * @param options - Options for the function.
 * @returns Defined function.
 */
export function defineFunction<
    TArgs extends s.ObjectSchemaProps = s.ObjectSchemaProps,
    TReturn extends s.Schema = s.Schema<void>,
>(options: FunctionOptions<TArgs, TReturn>): FunctionDefinition<TArgs, TReturn> {
    return {
        description: options.description,
        args: s.object({ props: options.args ?? {} }) as FunctionDefinition<TArgs, TReturn>['args'],
        return: options.return ?? (s.void() as TReturn),
        types: options.types,
        handler: options.handler,
        [FUNCTION_SYMBOL]: true,
    };
}

/**
 * Check if a value is a function.
 * @param value - Value to check.
 * @returns Whether the value is a function.
 */
export function isFunction(value: unknown): value is FunctionDefinition {
    return typeof value === 'object' && value !== null && FUNCTION_SYMBOL in value;
}
