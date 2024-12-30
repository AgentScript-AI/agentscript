import * as s from '@agentscript.ai/schema';

const FUNCTION_SYMBOL = Symbol('function');

export type FunctionOptions<TArgs extends s.ObjectSchemaProps, TReturn extends s.Schema> = {
    description?: string;
    args?: TArgs;
    return?: TReturn;
    handler: FunctionHandler<TArgs, TReturn>;
};

export type FunctionArgs<TArgs extends s.ObjectSchemaProps> = s.ObjectSchemaProps extends TArgs
    ? // eslint-disable-next-line @typescript-eslint/no-explicit-any
      any
    : s.ObjectSchemaPropsValue<TArgs>;

export type FunctionDefinition<
    TArgs extends s.ObjectSchemaProps = s.ObjectSchemaProps,
    TReturn extends s.Schema = s.SchemaAny,
> = {
    description?: string | string[];
    args: s.ObjectSchema<{ props: TArgs }>;
    return: TReturn;
    handler: FunctionHandler<TArgs, TReturn>;
    [FUNCTION_SYMBOL]: true;
};

export type FunctionParams<TArgs extends s.ObjectSchemaProps> = {
    args: FunctionArgs<TArgs>;
};

export type FunctionHandler<TArgs extends s.ObjectSchemaProps, TReturn extends s.Schema> = (
    params: FunctionParams<TArgs>,
) => s.SchemaValue<TReturn> | Promise<s.SchemaValue<TReturn>>;

export function defineFunction<
    TArgs extends s.ObjectSchemaProps = s.ObjectSchemaProps,
    TReturn extends s.Schema = s.Schema<void>,
>(options: FunctionOptions<TArgs, TReturn>): FunctionDefinition<TArgs, TReturn> {
    return {
        description: options.description,
        args: s.object({ props: options.args ?? {} }) as FunctionDefinition<TArgs, TReturn>['args'],
        return: options.return ?? (s.void() as TReturn),
        handler: options.handler,
        [FUNCTION_SYMBOL]: true,
    };
}

export function isFunction(value: unknown): value is FunctionDefinition {
    return typeof value === 'object' && value !== null && FUNCTION_SYMBOL in value;
}
