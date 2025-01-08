import { expect } from 'vitest';

import type { ExecuteAgentResult } from '../executeAgent.js';
import type { StackFrame } from '../runtimeTypes.js';

export function rootFrame(frame: Omit<StackFrame, 'startedAt'>): StackFrame {
    return {
        ...frame,
        startedAt: anyNumber(),
    };
}

export function agentResult(result: ExecuteAgentResult): ExecuteAgentResult {
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
