import type * as s from '@agentscript-ai/schema';

import type { ToolDefinition } from './defineTool.js';

/**
 * Schema for the input of the agent.
 */
export type AgentInputDefinition = Record<string, s.Schema> | undefined;
/**
 * Schema for the output of the agent.
 */
export type AgentOutputDefinition = s.Schema | undefined;

/**
 * AgentScript agent definition.
 */
export type AgentDefinition = {
    /**
     * Tools available to the agent.
     */
    readonly tools: RuntimeModule;
    /**
     * Schema for the input of the runtime.
     * Provide if you want the agent to accept a specific input.
     * Describe the input for best results.
     */
    readonly input?: Record<string, s.Schema>;
    /**
     * Schema for the output of the runtime.
     * Provide if you want the agent to return a specific value.
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
 * Infer the output type of an agent.
 */
export type AgentOutput<TAgent extends AgentDefinition> = TAgent['output'] extends s.Schema
    ? s.Infer<TAgent['output']>
    : undefined;

/**
 * Infer the input type of an agent.
 */
export type AgentInput<TAgent extends AgentDefinition> =
    TAgent['input'] extends Record<string, s.Schema>
        ? {
              [K in keyof TAgent['input']]: s.Infer<TAgent['input'][K]>;
          }
        : undefined;

/**
 * Define an agent. Useful for code reuse.
 * @param agent - Agent to define.
 * @returns Defined agent.
 */
export function defineAgent<TAgent extends AgentDefinition>(agent: TAgent) {
    return agent;
}
