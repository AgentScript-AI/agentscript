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
     * Definition of the agent.
     */
    readonly def: AgentDefinition<TTools, TInput, TOutput>;
    /**
     * ID of the agent.
     */
    readonly id: string;
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
 * Serialized agent.
 */
export type AgentSerialized = {
    /**
     * Agent ID.
     */
    id: string;
    /**
     * Agent script.
     */
    script: Script;
    /**
     * Agent plan.
     */
    plan?: string;
    /**
     * Agent heap. Holds all the values that are serialized.
     */
    heap: Heap;
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
