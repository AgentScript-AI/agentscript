/**
 * Stack frame.
 */
export interface StackFrame {
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
