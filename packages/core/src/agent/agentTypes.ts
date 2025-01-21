import type { LiteralExclude, LiteralPick } from '@nzyme/types';

import type {
    AgentDefinition,
    AgentInputBase,
    AgentOutput,
    AgentOutputBase,
    AgentTools,
} from './defineAgent.js';
import type { Heap } from '../heap/heapTypes.js';
import type { Script } from '../parser/astTypes.js';
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
     * Prompt used to create the agent.
     */
    readonly prompt?: string;
    /**
     * AgentScript script to execute.
     */
    readonly script: Script;
    /**
     * Plan for the agent.
     */
    readonly plan?: string;

    /**
     * Root frame of the agent execution stack.
     * Execution progress is stored here.
     */
    root: StackFrame;
} & (AgentStateComplete<TOutput> | AgentStateRunning);

type AgentStateComplete<TOutput extends AgentOutputBase> = {
    /**
     * Status of the agent execution.
     */
    status: LiteralPick<StackFrameStatus, 'finished'>;
    /**
     * Output of the agent.
     */
    output: AgentOutput<TOutput>;
};

type AgentStateRunning = {
    /**
     * Status of the agent execution.
     */
    status: LiteralExclude<StackFrameStatus, 'finished'>;
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
     * Agent plan.
     */
    plan?: string;
    /**
     * Root frame.
     */
    root: StackFrameSerialized;
    /**
     * Output of the agent.
     * Refers to the index of the output in the heap.
     */
    output?: number;
};
