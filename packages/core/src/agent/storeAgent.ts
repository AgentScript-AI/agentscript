import type { Serializer } from '@agentscript-ai/serializer';
import { createSerializer } from '@agentscript-ai/serializer';

import type { Agent, AgentSerialized, AgentState, AgentStateSerialized } from './agentTypes.js';
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
    const serializer = createSerializer();
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
    serializer: Serializer,
    timestamp: number,
): AgentStateSerialized {
    return {
        root: serializeFrame(state.root, serializer, timestamp),
        script: state.script,
        output: state.output !== undefined ? serializer.push(state.output) : undefined,
        metadata: serializer.push(state.metadata),
    };
}

function serializeFrame(frame: StackFrame, serializer: Serializer, timestamp: number) {
    const serialized: StackFrameSerialized = {
        s: serializeStatus(frame.status),
        t: frame.startedAt.getTime() - timestamp,
        u: frame.updatedAt.getTime() - timestamp,
        vr: frame.variables ? serializer.push(frame.variables) : undefined,
        err: frame.error,
        v: frame.value !== undefined ? serializer.push(frame.value) : undefined,
        st: frame.state !== undefined ? serializer.push(frame.state) : undefined,
        ev: frame.events?.map(event => ({
            timestamp: event.timestamp.getTime() - timestamp,
            payload: serializer.push(event.payload),
            processed: event.processed,
        })),
    };

    const children = frame.children?.map(child =>
        child ? serializeFrame(child, serializer, timestamp) : null,
    );

    if (children?.length) {
        serialized.c = children;
    }

    return serialized;
}

function serializeStatus(status: StackFrameStatus): StackFrameStatusSerialized {
    switch (status) {
        case 'running':
            return 'R';
        case 'done':
            return 'D';
        case 'error':
            return 'E';
        case 'awaiting':
            return 'A';
    }
}
