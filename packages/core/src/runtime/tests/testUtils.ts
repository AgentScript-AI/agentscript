import { expect } from 'vitest';

import type { ExecuteAgentResult } from '../executeAgent.js';
import type { StackFrame } from '../runtimeTypes.js';

export function rootFrame(frame: Omit<StackFrame, 'startedAt' | 'trace'>): StackFrame {
    return {
        ...frame,
        startedAt: anyDate(),
        trace: '0',
    };
}

export function agentResult(result: ExecuteAgentResult): ExecuteAgentResult {
    return result;
}

export function childFrame(frame: Omit<StackFrame, 'startedAt'>): StackFrame {
    return {
        ...frame,
        startedAt: anyDate(),
        parent: expect.any(Object) as StackFrame,
    };
}

export function completedFrame(frame: Omit<StackFrame, 'startedAt' | 'completedAt'>): StackFrame {
    return {
        ...childFrame(frame),
        completedAt: anyDate(),
    };
}

export function anyNumber() {
    return expect.any(Number) as number;
}

export function anyDate() {
    return expect.any(Date) as Date;
}
