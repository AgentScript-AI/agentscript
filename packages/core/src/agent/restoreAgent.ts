import type { LiteralPick } from '@nzyme/types';

import type { Agent, AgentSerialized, AgentState, AgentStateSerialized } from './agentTypes.js';
import type {
    AgentDefinition,
    AgentInputBase,
    AgentOutputBase,
    AgentTools,
} from './defineAgent.js';
import { rechainAgent } from './rechainAgent.js';
import type { HeapDeserializer } from '../heap/createHeapDeserializer.js';
import { createHeapDeserializer } from '../heap/createHeapDeserializer.js';
import type { Metadata } from '../meta/defineMetadata.js';
import type {
    StackFrame,
    StackFrameSerialized,
    StackFrameStatus,
    StackFrameStatusSerialized,
} from '../runtime/runtimeTypes.js';

/**
 * Deserialize an agent.
 * @param agentSerialized - Serialized agent state.
 * @param agentDefinition - Agent definition.
 * @returns Deserialized agent.
 */
export function restoreAgent<
    TTools extends AgentTools,
    TInput extends AgentInputBase,
    TOutput extends AgentOutputBase,
>(agentSerialized: AgentSerialized, agentDefinition: AgentDefinition<TTools, TInput, TOutput>) {
    const heap = createHeapDeserializer(agentSerialized.heap);
    const createdAt = agentSerialized.createdAt;
    const state = deserializeState(agentSerialized, heap, createdAt);
    const chain = agentSerialized.chain?.map(state => deserializeState(state, heap, createdAt));

    const agent: Agent = {
        id: agentSerialized.id,
        def: agentDefinition,
        runtime: agentSerialized.runtime,
        createdAt: new Date(createdAt),
        chain,
        ...state,
    };

    rechainAgent(agent);

    return agent as Agent<TTools, TInput, TOutput>;
}

function deserializeState(
    state: AgentStateSerialized,
    heap: HeapDeserializer,
    timestamp: number,
): AgentState {
    const root = deserializeFrame(state.root, heap, '0', timestamp);
    const output = state.output ? heap.get(state.output) : undefined;
    const metadata: Metadata = (heap.get(state.metadata) as Metadata) ?? {};

    return {
        script: state.script,
        status: root.status as LiteralPick<StackFrameStatus, 'done'>,
        root,
        output,
        metadata,
    };
}

function deserializeFrame(
    frameSerialized: StackFrameSerialized,
    heap: HeapDeserializer,
    trace: string,
    timestamp: number,
): StackFrame {
    const frame: StackFrame = {
        trace,
        status: deserializeStatus(frameSerialized.s),
        startedAt: new Date(frameSerialized.t + timestamp),
        updatedAt: new Date(frameSerialized.u + timestamp),
        variables:
            frameSerialized.vr !== undefined
                ? (heap.get(frameSerialized.vr) as Record<string, unknown>)
                : undefined,
        error: frameSerialized.err,
        value: frameSerialized.v !== undefined ? heap.get(frameSerialized.v) : undefined,
        state: frameSerialized.st !== undefined ? heap.get(frameSerialized.st) : undefined,
        events: frameSerialized.ev?.map(event => ({
            timestamp: new Date(event.timestamp + timestamp),
            payload: heap.get(event.payload),
            processed: event.processed,
        })),
    };

    frame.children = frameSerialized.c?.map((child, index) => {
        if (!child) {
            return null;
        }

        const childFrame = deserializeFrame(child, heap, `${trace}:${index}`, timestamp);
        childFrame.parent = frame;
        return childFrame;
    });

    return frame;
}

function deserializeStatus(status: StackFrameStatusSerialized): StackFrameStatus {
    switch (status) {
        case 'R':
            return 'running';
        case 'D':
            return 'done';
        case 'E':
            return 'error';
        case 'A':
            return 'awaiting';
    }
}
