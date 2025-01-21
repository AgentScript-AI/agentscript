import type { Agent, AgentSerialized, AgentState, AgentStateSerialized } from './agentTypes.js';
import type { HeapSerializer } from '../heap/createHeapSerializer.js';
import { createHeapSerializer } from '../heap/createHeapSerializer.js';
import type { StackFrame, StackFrameSerialized } from '../runtime/runtimeTypes.js';

/**
 * Serialize an agent for storage.
 * @param agent - Agent to serialize.
 * @returns Serialized agent.
 */
export function storeAgent(agent: Agent): AgentSerialized {
    const serializer = createHeapSerializer();

    const state = serializeState(agent, serializer);
    const chain = agent.chain?.map(state => serializeState(state, serializer));

    return {
        id: agent.id,
        runtime: agent.runtime,
        heap: serializer.heap,
        chain,
        ...state,
    };
}

function serializeState(state: AgentState, heap: HeapSerializer): AgentStateSerialized {
    return {
        root: serializeFrame(state.root, heap),
        script: state.script,
        plan: state.plan,
        output: state.output !== undefined ? heap.push(state.output) : undefined,
    };
}

function serializeFrame(frame: StackFrame, heap: HeapSerializer): StackFrameSerialized {
    return {
        status: frame.status,
        startedAt: frame.startedAt.getTime(),
        updatedAt: frame.updatedAt.getTime(),
        variables: frame.variables ? heap.push(frame.variables) : undefined,
        error: frame.error,
        value: frame.value !== undefined ? heap.push(frame.value) : undefined,
        state: frame.state !== undefined ? heap.push(frame.state) : undefined,
        events: frame.events?.map(event => ({
            timestamp: event.timestamp.getTime(),
            payload: heap.push(event.payload),
            processed: event.processed,
        })),
        children: frame.children?.map(child => serializeFrame(child, heap)),
    };
}
