import type { z } from 'zod';

import type { ServiceContext } from '@nzyme/ioc';
import { defineCommand } from '@nzyme/ioc';
import type { Immutable } from '@nzyme/types';

import type { AgentState } from './AgentState.js';

export type ToolInput<T extends z.AnyZodObject = z.AnyZodObject> = z.infer<T>;
export type ToolResult<T extends z.ZodTypeAny = z.ZodUnknown> = Promise<z.infer<T>>;

export interface ToolFunction<
    TInput extends z.AnyZodObject = z.AnyZodObject,
    TOutput extends z.ZodTypeAny = z.ZodUnknown,
> {
    (input: ToolInput<TInput>, state: Immutable<AgentState>): ToolResult<TOutput>;
}

export interface ToolParams<TInput extends z.AnyZodObject, TOutput extends z.ZodTypeAny> {
    name: string;
    description: string;
    input: TInput;
    output: TOutput;
    setup: (ctx: ServiceContext) => ToolFunction<TInput, TOutput>;
}

export type ToolDefinition<
    TInput extends z.AnyZodObject = z.AnyZodObject,
    TOutput extends z.ZodTypeAny = z.ZodUnknown,
> = ReturnType<typeof defineTool<TInput, TOutput>>;

export function defineTool<TInput extends z.AnyZodObject, TOutput extends z.ZodTypeAny>(
    definition: ToolParams<TInput, TOutput>,
) {
    return defineCommand({
        name: definition.name,
        description: definition.description,
        input: definition.input,
        output: definition.output,
        setup: definition.setup,
    });
}
