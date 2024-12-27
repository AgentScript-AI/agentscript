import * as z from 'zod';

import type { EmptyObject } from '@nzyme/types';

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

export type FunctionParams<TArgs extends FunctionArgs> = FunctionArgs extends TArgs
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
};

export type FunctionHandler<TArgs extends FunctionArgs, TReturn extends z.ZodTypeAny> = (
    args: FunctionParams<TArgs>,
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
    };
}
