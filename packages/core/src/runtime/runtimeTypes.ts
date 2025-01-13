import type { ToolEvent, ToolEventSerialized } from '../tools/defineTool.js';

/**
 * Status of the stack frame.
 */
export type StackFrameStatus = 'running' | 'finished' | 'error' | 'awaiting';

/**
 * Stack frame.
 */
export interface StackFrame {
    /**
     * Trace of the frame.
     * This is a unique identifier for the frame in the execution state.
     */
    trace: string;
    /**
     * Status of the frame.
     */
    status: StackFrameStatus;
    /**
     * Started at.
     */
    startedAt: Date;
    /**
     * Updated at.
     */
    updatedAt: Date;
    /**
     * Variables.
     */
    variables?: Record<string, unknown>;
    /**
     * Parent frame.
     */
    parent?: StackFrame;
    /**
     * Error, if any.
     */
    error?: string;
    /**
     * Value, ie the result of the function.
     */
    value?: unknown;
    /**
     * State, ie the state of the tool.
     */
    state?: unknown;
    /**
     * Events for the tool.
     */
    events?: ToolEvent[];
    /**
     * Children frames.
     */
    children?: StackFrame[];
}

/**
 * Serialized stack frame.
 */
export interface StackFrameSerialized {
    /**
     * Status of the frame.
     */
    status: StackFrameStatus;
    /**
     * Started at.
     */
    startedAt: number;
    /**
     * Updated at.
     */
    updatedAt: number;
    /**
     * Variables.
     * Refers to the index of the variables in the heap.
     */
    variables?: number;
    /**
     * Error, if any.
     */
    error?: string;
    /**
     * Value, ie the result of the function.
     * Refers to the index of the value in the heap.
     */
    value?: number;
    /**
     * State, ie the state of the tool.
     * Refers to the index of the state in the heap.
     */
    state?: number;
    /**
     * Events for the tool.
     */
    events?: ToolEventSerialized[];
    /**
     * Children frames.
     */
    children?: StackFrameSerialized[];
}
