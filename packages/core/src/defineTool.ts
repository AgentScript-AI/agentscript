import type { z } from 'zod';

import type { ServiceContext } from '@nzyme/ioc';
import { defineService } from '@nzyme/ioc';

import type { ToolCall } from './models/AgentEvent.js';
import type { AgentState } from './models/AgentState.js';

export type ToolInput<T extends z.AnyZodObject = z.AnyZodObject> = z.infer<T>;

export type ToolState = z.AnyZodObject | undefined;
export type ToolInteraction = z.AnyZodObject | undefined;

export interface ToolContext<TInput extends z.AnyZodObject> {
    call: ToolCall;
    input: z.infer<TInput>;
    agent: AgentState;
}

export interface ToolInteractContext<
    TInput extends z.AnyZodObject,
    TState extends ToolState,
    TInteraction extends ToolInteraction,
> extends ToolContext<TInput> {
    state: TState extends z.AnyZodObject ? z.infer<TState> : undefined;
    interaction: TInteraction extends z.AnyZodObject ? z.infer<TInteraction> : undefined;
}

export type ToolInvokeResult<TState extends ToolState = ToolState> = TState extends z.AnyZodObject
    ? {
          requireResponse?: boolean;
          state?: z.infer<TState>;
      }
    : { requireResponse?: boolean; state?: undefined } | undefined | void;

export interface Tool<
    TInput extends z.AnyZodObject = z.AnyZodObject,
    TState extends ToolState = undefined,
    TInteraction extends ToolInteraction = undefined,
> {
    invoke: (ctx: ToolContext<TInput>) => Promise<ToolInvokeResult<TState>>;
    interact?: (ctx: ToolInteractContext<TInput, TState, TInteraction>) => Promise<void>;
}

export interface ToolParams<
    TInput extends z.AnyZodObject,
    TState extends ToolState = undefined,
    TInteraction extends ToolInteraction = undefined,
> {
    name: string;
    description: string;
    input: TInput;
    state?: TState;
    interaction?: TInteraction;
    setup: (ctx: ServiceContext) => Tool<TInput, TState, TInteraction>;
}

export type ToolDefinition<
    TInput extends z.AnyZodObject = z.AnyZodObject,
    TState extends ToolState = ToolState,
    TInteraction extends ToolInteraction = ToolInteraction,
> = ReturnType<typeof defineTool<TInput, TState, TInteraction>>;

export function defineTool<
    TInput extends z.AnyZodObject,
    TState extends ToolState = undefined,
    TInteraction extends ToolInteraction = undefined,
>(definition: ToolParams<TInput, TState, TInteraction>) {
    return defineService({
        name: definition.name,
        description: definition.description,
        input: definition.input,
        state: definition.state,
        interaction: definition.interaction,
        setup: definition.setup,
    });
}
