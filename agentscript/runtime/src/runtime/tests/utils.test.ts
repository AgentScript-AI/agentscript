import { expect } from 'vitest';

import type { RuntimeResult } from '../executeRuntime.js';
import type { StackFrame } from '../stackTypes.js';

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

export function anyNumber() {
    return expect.any(Number) as number;
}
