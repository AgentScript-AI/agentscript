import type { z } from 'zod';

import type { ServiceContext } from '@nzyme/ioc';
import { defineCommand } from '@nzyme/ioc';
import type { Immutable } from '@nzyme/types';

import type { AgentState } from '../AgentState.js';

export type ToolInput<T extends z.AnyZodObject = z.AnyZodObject> = z.infer<T>;
export type ToolResult = Promise<unknown>;

export interface ToolFunction<T extends z.AnyZodObject = z.AnyZodObject> {
    (input: ToolInput<T>, state: Immutable<AgentState>): ToolResult;
}

export interface ToolParams<T extends z.AnyZodObject = z.AnyZodObject> {
    name: string;
    description: string;
    schema: T;
    setup: (ctx: ServiceContext) => ToolFunction<T>;
}

export type ToolDefinition = ReturnType<typeof defineTool>;

export function defineTool<T extends z.AnyZodObject>(definition: ToolParams<T>) {
    return defineCommand({
        name: definition.name,
        description: definition.description,
        schema: definition.schema,
        setup: definition.setup as ToolParams['setup'],
    });
}
