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
import type {
    StackFrame,
    StackFrameSerialized,
    StackFrameStatus,
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
    const state = deserializeState(agentSerialized, heap);
    const chain = agentSerialized.chain?.map(state => deserializeState(state, heap));

    const agent: Agent = {
        id: agentSerialized.id,
        def: agentDefinition,
        runtime: agentSerialized.runtime,
        chain,
        ...state,
    };

    rechainAgent(agent);

    return agent as Agent<TTools, TInput, TOutput>;
}

function deserializeState(state: AgentStateSerialized, heap: HeapDeserializer): AgentState {
    const root = deserializeFrame(state.root, heap, '0');
    const output = state.output ? heap.get(state.output) : undefined;

    return {
        script: state.script,
        plan: state.plan,
        status: root.status as LiteralPick<StackFrameStatus, 'finished'>,
        root,
        output,
    };
}

function deserializeFrame(
    frameSerialized: StackFrameSerialized,
    heap: HeapDeserializer,
    trace: string,
): StackFrame {
    const frame: StackFrame = {
        trace,
        status: frameSerialized.status,
        startedAt: new Date(frameSerialized.startedAt),
        updatedAt: new Date(frameSerialized.updatedAt),
        variables:
            frameSerialized.variables !== undefined
                ? (heap.get(frameSerialized.variables) as Record<string, unknown>)
                : undefined,
        error: frameSerialized.error,
        value: frameSerialized.value !== undefined ? heap.get(frameSerialized.value) : undefined,
        state: frameSerialized.state !== undefined ? heap.get(frameSerialized.state) : undefined,
        events: frameSerialized.events?.map(event => ({
            timestamp: new Date(event.timestamp),
            payload: heap.get(event.payload),
            processed: event.processed,
        })),
        children: frameSerialized.children?.map((child, index) =>
            deserializeFrame(child, heap, `${trace}:${index}`),
        ),
    };

    frame.children = frameSerialized.children?.map((child, index) => {
        const childFrame = deserializeFrame(child, heap, `${trace}:${index}`);
        childFrame.parent = frame;
        return childFrame;
    });

    return frame;
}
