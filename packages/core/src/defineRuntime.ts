import type { Schema } from '@agentscript-ai/schema';

import type { ToolDefinition } from './defineTool.js';

/**
 * AgentScript runtime.
 */
export type Runtime = RuntimeModule & {
    readonly [name: `$${string}`]: Schema;
};

/**
 * AgentScript runtime module.
 */
export type RuntimeModule = {
    readonly [name: string]: Schema | ToolDefinition | RuntimeModule;
};

/**
 * Define a runtime.
 * @param runtime - Runtime to define.
 * @returns Defined runtime.
 */
export function defineRuntime<TRuntime extends Runtime>(runtime: TRuntime) {
    return runtime;
}
