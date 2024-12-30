export interface StackFrame {
    startedAt: number;
    completedAt?: number;
    variables?: Record<string, unknown>;
    parent?: StackFrame;
    error?: string;
    result?: unknown;
    children?: StackFrame[];
}

export interface StackBlockFrame extends StackFrame {
    variables: Record<string, unknown>;
    frames: StackFrame[];
}

export interface StackFunctionFrame extends StackFrame {
    state: unknown;
}

export interface StackLoopFrame extends StackFrame {
    itemName: string;
    itemBlocks: StackBlockFrame[];
}
