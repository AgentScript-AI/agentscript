import type { LiteralPick } from '@nzyme/types';

import type { Agent, AgentSerialized } from './agentTypes.js';
import type {
    AgentDefinition,
    AgentInputBase,
    AgentOutput,
    AgentOutputBase,
    AgentTools,
} from './defineAgent.js';
import type { HeapDeserializer } from '../heap/createHeapDeserializer.js';
import { createHeapDeserializer } from '../heap/createHeapDeserializer.js';
import type {
    StackFrame,
    StackFrameSerialized,
    StackFrameStatus,
} from '../runtime/runtimeTypes.js';
/**
 * Parameters for {@link deserializeAgent}.
 */
export type DeserializeAgentOptions<
    TTools extends AgentTools,
    TInput extends AgentInputBase,
    TOutput extends AgentOutputBase,
> = AgentDefinition<TTools, TInput, TOutput> & {
    state: AgentSerialized;
};

/**
 * Deserialize an agent.
 * @param options - Serialized agent.
 * @returns Deserialized agent.
 */
export function deserializeAgent<
    TTools extends AgentTools,
    TInput extends AgentInputBase,
    TOutput extends AgentOutputBase,
>(options: DeserializeAgentOptions<TTools, TInput, TOutput>) {
    const heap = createHeapDeserializer(options.state.heap);
    const root = deserializeFrame(options.state.root, heap, '0');

    const agent: Agent = {
        id: options.state.id,
        def: {
            tools: options.tools,
            input: options.input,
            output: options.output,
        },
        script: options.state.script,
        plan: options.state.plan,
        status: root.status as LiteralPick<StackFrameStatus, 'finished'>,
        root,
        output: options.state.output
            ? (heap.get(options.state.output) as AgentOutput<TOutput>)
            : undefined,
    };

    return agent as Agent<TTools, TInput, TOutput>;
}

function deserializeFrame(
    frame: StackFrameSerialized,
    heap: HeapDeserializer,
    trace: string,
): StackFrame {
    return {
        trace,
        status: frame.status,
        startedAt: new Date(frame.startedAt),
        updatedAt: new Date(frame.updatedAt),
        variables: frame.variables
            ? (heap.get(frame.variables) as Record<string, unknown>)
            : undefined,
        error: frame.error,
        value: frame.value ? heap.get(frame.value) : undefined,
        state: frame.state ? heap.get(frame.state) : undefined,
        events: frame.events?.map(event => ({
            timestamp: new Date(event.timestamp),
            payload: heap.get(event.payload),
            processed: event.processed,
        })),
        children: frame.children?.map((child, index) =>
            deserializeFrame(child, heap, `${trace}:${index}`),
        ),
    };
}
