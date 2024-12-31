import { expect } from 'vitest';

import type { RuntimeResult } from '../executeWorkflow.js';
import type { StackFrame } from '../runtimeTypes.js';

export function rootFrame(frame: Omit<StackFrame, 'startedAt'>): StackFrame {
    return {
        ...frame,
        startedAt: anyNumber(),
    };
}

export function runtimeResult(result: RuntimeResult): RuntimeResult {
    return result;
}

export function childFrame(frame: Omit<StackFrame, 'startedAt'>): StackFrame {
    return {
        ...frame,
        startedAt: anyNumber(),
        parent: expect.any(Object) as StackFrame,
    };
}

export function completedFrame(frame: Omit<StackFrame, 'startedAt' | 'completedAt'>): StackFrame {
    return {
        ...childFrame(frame),
        completedAt: anyNumber(),
    };
}

export function anyNumber() {
    return expect.any(Number) as number;
}
