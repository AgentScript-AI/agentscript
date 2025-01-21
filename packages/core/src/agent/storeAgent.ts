import type { Agent, AgentSerialized, AgentState, AgentStateSerialized } from './agentTypes.js';
import type { HeapSerializer } from '../heap/createHeapSerializer.js';
import { createHeapSerializer } from '../heap/createHeapSerializer.js';
import type {
    StackFrame,
    StackFrameSerialized,
    StackFrameStatus,
    StackFrameStatusSerialized,
} from '../runtime/runtimeTypes.js';

/**
 * Serialize an agent for storage.
 * @param agent - Agent to serialize.
 * @returns Serialized agent.
 */
export function storeAgent(agent: Agent): AgentSerialized {
    const serializer = createHeapSerializer();
    const createdAt = agent.createdAt.getTime();

    const state = serializeState(agent, serializer, createdAt);
    const chain = agent.chain?.map(state => serializeState(state, serializer, createdAt));

    return {
        id: agent.id,
        runtime: agent.runtime,
        heap: serializer.heap,
        chain,
        createdAt,
        ...state,
    };
}

function serializeState(
    state: AgentState,
    heap: HeapSerializer,
    timestamp: number,
): AgentStateSerialized {
    return {
        root: serializeFrame(state.root, heap, timestamp),
        script: state.script,
        plan: state.plan,
        output: state.output !== undefined ? heap.push(state.output) : undefined,
    };
}

function serializeFrame(
    frame: StackFrame,
    heap: HeapSerializer,
    timestamp: number,
): StackFrameSerialized {
    return {
        s: serializeStatus(frame.status),
        t: frame.startedAt.getTime() - timestamp,
        u: frame.updatedAt.getTime() - timestamp,
        vr: frame.variables ? heap.push(frame.variables) : undefined,
        err: frame.error,
        v: frame.value !== undefined ? heap.push(frame.value) : undefined,
        st: frame.state !== undefined ? heap.push(frame.state) : undefined,
        ev: frame.events?.map(event => ({
            timestamp: event.timestamp.getTime() - timestamp,
            payload: heap.push(event.payload),
            processed: event.processed,
        })),
        c: frame.children?.map(child => serializeFrame(child, heap, timestamp)),
    };
}

function serializeStatus(status: StackFrameStatus): StackFrameStatusSerialized {
    switch (status) {
        case 'running':
            return 'R';
        case 'finished':
            return 'F';
        case 'error':
            return 'E';
        case 'awaiting':
            return 'A';
    }
}
