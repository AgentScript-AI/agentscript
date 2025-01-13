import type { SomeObject } from '@nzyme/types';

import type * as s from '@agentscript-ai/schema';

import type { ToolDefinition } from '../tools/defineTool.js';

/**
 * Schema for the input of the agent.
 */
export type AgentInputDefinition = Record<string, s.Schema> | undefined;
/**
 * Schema for the output of the agent.
 */
export type AgentOutputDefinition = s.Schema | undefined;

/**
 * Base type for tools available to the agent.
 */
export type AgentTools = RuntimeModule;
/**
 * Base type for the input of the agent.
 */
export type AgentInputBase = Record<string, s.Schema>;
/**
 * Base type for the output of the agent.
 */
export type AgentOutputBase = s.Schema | undefined;

/**
 * AgentScript agent definition.
 */
export type AgentDefinition<
    TTools extends AgentTools = AgentTools,
    TInput extends AgentInputBase = AgentInputBase,
    TOutput extends AgentOutputBase = AgentOutputBase,
> = {
    /**
     * Tools available to the agent.
     */
    readonly tools: TTools;
    /**
     * Schema for the input of the runtime.
     * Provide if you want the agent to accept a specific input.
     * Describe the input for best results.
     */
    readonly input?: TInput;
    /**
     * Schema for the output of the runtime.
     * Provide if you want the agent to return a specific value.
     * Describe the output for best results.
     */
    readonly output?: TOutput;
};

/**
 * AgentScript runtime module.
 */
export type RuntimeModule = {
    readonly [name: string]: ToolDefinition | RuntimeModule;
};

/**
 * Infer the output type of an agent.
 */
export type AgentOutput<TOutput extends AgentOutputBase> = s.InferOr<TOutput, undefined>;
/**
 * Infer the input type of an agent.
 */
export type AgentInput<TInput extends AgentInputBase> = {
    [K in keyof TInput]: s.Infer<TInput[K]>;
};

/**
 * Define an agent. Useful for code reuse.
 * @param agent - Agent to define.
 * @returns Defined agent.
 */
export function defineAgent<
    TTools extends AgentTools = SomeObject,
    TInput extends AgentInputBase = SomeObject,
    TOutput extends AgentOutputBase = undefined,
>(agent: AgentDefinition<TTools, TInput, TOutput>) {
    return agent;
}
