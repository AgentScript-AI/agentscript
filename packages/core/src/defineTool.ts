import type { z } from 'zod';

import type { ServiceContext } from '@nzyme/ioc';
import { defineCommand } from '@nzyme/ioc';

import type { ToolCall } from './models/AgentEvent.js';
import type { AgentState } from './models/AgentState.js';

export type ToolInput<T extends z.AnyZodObject = z.AnyZodObject> = z.infer<T>;

export type ToolContext = {
    state: AgentState;
    call: ToolCall;
};

export interface ToolResult {
    requireResponse?: boolean;
}

export interface ToolFunction<TInput extends z.AnyZodObject = z.AnyZodObject> {
    (input: ToolInput<TInput>, ctx: ToolContext): Promise<ToolResult | void>;
}

export interface ToolParams<TInput extends z.AnyZodObject> {
    name: string;
    description: string;
    input: TInput;
    setup: (ctx: ServiceContext) => ToolFunction<TInput>;
}

export type ToolDefinition<TInput extends z.AnyZodObject = z.AnyZodObject> = ReturnType<
    typeof defineTool<TInput>
>;

export function defineTool<TInput extends z.AnyZodObject>(definition: ToolParams<TInput>) {
    return defineCommand({
        name: definition.name,
        description: definition.description,
        input: definition.input,
        setup: definition.setup,
    });
}
