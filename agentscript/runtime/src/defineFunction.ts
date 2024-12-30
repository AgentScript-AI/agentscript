import * as z from 'zod';

import type { EmptyObject } from '@nzyme/types';

const FUNCTION_SYMBOL = Symbol('function');

export type FunctionArgs = {
    [name: string]: z.ZodTypeAny;
};

export type FunctionOptions<
    TArgs extends FunctionArgs = EmptyObject,
    TReturn extends z.ZodTypeAny = z.ZodType<void>,
> = {
    description?: string;
    args?: TArgs;
    return?: TReturn;
    handler: FunctionHandler<TArgs, TReturn>;
};

export type FunctionArgsValue<TArgs extends FunctionArgs> = FunctionArgs extends TArgs
    ? // eslint-disable-next-line @typescript-eslint/no-explicit-any
      any
    : {
          [K in keyof TArgs]: z.infer<TArgs[K]>;
      };

export type FunctionDefinition<
    TArgs extends FunctionArgs = FunctionArgs,
    TReturn extends z.ZodTypeAny = z.ZodType<unknown>,
> = {
    description?: string | string[];
    args: TArgs;
    return: TReturn;
    handler: FunctionHandler<TArgs, TReturn>;
    [FUNCTION_SYMBOL]: true;
};

export type FunctionParams<TArgs extends FunctionArgs> = {
    args: FunctionArgsValue<TArgs>;
};

export type FunctionHandler<TArgs extends FunctionArgs, TReturn extends z.ZodTypeAny> = (
    params: FunctionParams<TArgs>,
) => z.infer<TReturn> | Promise<z.infer<TReturn>>;

export function defineFunction<
    TArgs extends FunctionArgs = EmptyObject,
    TReturn extends z.ZodTypeAny = z.ZodVoid,
>(options: FunctionOptions<TArgs, TReturn>): FunctionDefinition<TArgs, TReturn> {
    return {
        description: options.description,
        args: options.args ?? ({} as TArgs),
        return: options.return ?? (z.void() as TReturn),
        handler: options.handler,
        [FUNCTION_SYMBOL]: true,
    };
}

export function isFunction(value: unknown): value is FunctionDefinition {
    return typeof value === 'object' && value !== null && FUNCTION_SYMBOL in value;
}
