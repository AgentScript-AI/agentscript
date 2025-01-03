import type * as s from '@agentscript-ai/schema';

import type { ToolDefinition } from './defineTool.js';

/**
 * AgentScript runtime.
 */
export type Runtime = {
    /**
     * Tools available to the runtime.
     */
    readonly tools: RuntimeModule;
    /**
     * Schema for the input of the runtime.
     * Provide if you want the workflow to accept a specific input.
     * Describe the input for best results.
     */
    readonly input?: Record<string, s.Schema>;
    /**
     * Schema for the output of the runtime.
     * Provide if you want the workflow to return a specific value.
     * Describe the output for best results.
     */
    readonly output?: s.Schema;
};

/**
 * AgentScript runtime module.
 */
export type RuntimeModule = {
    readonly [name: string]: s.Schema | ToolDefinition | RuntimeModule;
};

/**
 * Infer the output type of a runtime.
 */
export type RuntimeOutput<TRuntime extends Runtime> = TRuntime['output'] extends s.Schema
    ? s.Infer<TRuntime['output']>
    : undefined;

/**
 * Infer the input type of a runtime.
 */
export type RuntimeInput<TRuntime extends Runtime> =
    TRuntime['input'] extends Record<string, s.Schema>
        ? {
              [K in keyof TRuntime['input']]: s.Infer<TRuntime['input'][K]>;
          }
        : undefined;

/**
 * Define a runtime.
 * @param runtime - Runtime to define.
 * @returns Defined runtime.
 */
export function defineRuntime<TRuntime extends Runtime>(runtime: TRuntime) {
    return runtime;
}
