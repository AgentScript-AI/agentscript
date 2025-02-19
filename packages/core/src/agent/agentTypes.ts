import type { LiteralExclude, LiteralPick } from '@nzyme/types';

import type { Script } from '@agentscript-ai/parser';

import type {
    AgentDefinition,
    AgentInputBase,
    AgentOutput,
    AgentOutputBase,
    AgentTools,
} from './defineAgent.js';
import type { Heap } from '../heap/heapTypes.js';
import type { Metadata } from '../meta/defineMetadata.js';
import type {
    StackFrame,
    StackFrameSerialized,
    StackFrameStatus,
} from '../runtime/runtimeTypes.js';

/**
 * Agent object.
 */
export type Agent<
    TTools extends AgentTools = AgentTools,
    TInput extends AgentInputBase = AgentInputBase,
    TOutput extends AgentOutputBase = AgentOutputBase,
> = {
    /**
     * ID of the agent.
     */
    readonly id: string;
    /**
     * Timestamp of the agent creation.
     */
    readonly createdAt: Date;
    /**
     * Agent runtime.
     */
    readonly runtime: AgentRuntime;
    /**
     * Definition of the agent.
     */
    readonly def: AgentDefinition<TTools, TInput, TOutput>;
    /**
     * Chain of agents.
     */
    readonly chain?: AgentState[];
} & AgentState<TOutput>;

/**
 * Agent state.
 */
export type AgentState<TOutput extends AgentOutputBase = AgentOutputBase> = {
    /**
     * AgentScript script to execute.
     */
    readonly script: Script;
    /**
     * Root frame of the agent execution stack.
     * Execution progress is stored here.
     */
    root: StackFrame;
    /**
     * Metadata of the agent.
     */
    metadata: Metadata;
} & (AgentStateComplete<TOutput> | AgentStateRunning);

type AgentStateComplete<TOutput extends AgentOutputBase> = {
    /**
     * Status of the agent execution.
     */
    status: LiteralPick<StackFrameStatus, 'done'>;
    /**
     * Output of the agent.
     */
    output: AgentOutput<TOutput>;
};

type AgentStateRunning = {
    /**
     * Status of the agent execution.
     */
    status: LiteralExclude<StackFrameStatus, 'done'>;
    /**
     * Output of the agent.
     */
    output?: undefined;
};

/**
 * Agent runtime.
 */
export type AgentRuntime = {
    /**
     * AgentScript runtime code.
     */
    readonly code: string;
    /**
     * Hash of the agent runtime code.
     */
    readonly hash: string;
};

/**
 * Agent for a given definition.
 */
export type AgentFor<TDef extends AgentDefinition> =
    TDef extends AgentDefinition<infer TTools, infer TInput, infer TOutput>
        ? Agent<TTools, TInput, TOutput>
        : never;

/**
 * Serialized agent.
 */
export type AgentSerialized = {
    /**
     * Agent ID.
     */
    id: string;
    /**
     * Runtime of the agent.
     */
    runtime: AgentRuntime;
    /**
     * Timestamp of the agent creation.
     */
    createdAt: number;
    /**
     * Agent heap. Holds all the values that are serialized.
     */
    heap: Heap;
    /**
     * Chain of previous agents.
     */
    chain?: AgentStateSerialized[];
} & AgentStateSerialized;

/**
 * Serialized agent state.
 */
export type AgentStateSerialized = {
    /**
     * Agent script.
     */
    script: Script;
    /**
     * Root frame.
     */
    root: StackFrameSerialized;
    /**
     * Output of the agent.
     * Refers to the index of the output in the heap.
     */
    output?: number;
    /**
     * Metadata ref of the agent.
     */
    metadata: number;
};
