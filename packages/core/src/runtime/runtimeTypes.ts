import type { ToolEvent } from '../defineTool.js';

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
     * Started at.
     */
    startedAt: Date;
    /**
     * Completed at.
     */
    completedAt?: Date;
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
 * Stack block frame.
 */
export interface StackBlockFrame extends StackFrame {
    /**
     * Variables.
     */
    variables: Record<string, unknown>;
    /**
     * Frames.
     */
    frames: StackFrame[];
}

/**
 * Stack loop frame.
 */
export interface StackLoopFrame extends StackFrame {
    /**
     * Item name.
     */
    itemName: string;
    /**
     * Item blocks.
     */
    itemBlocks: StackBlockFrame[];
}
