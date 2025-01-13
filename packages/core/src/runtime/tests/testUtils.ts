import { expect } from 'vitest';

import type { ExecuteAgentResult } from '../executeAgent.js';
import type { StackFrame } from '../runtimeTypes.js';

export function rootFrame(
    frame: Omit<StackFrame, 'startedAt' | 'updatedAt' | 'trace' | 'status'> & {
        status?: StackFrame['status'];
    },
): StackFrame {
    return {
        ...frame,
        startedAt: anyDate(),
        updatedAt: anyDate(),
        trace: '0',
        status: frame.status || 'running',
    };
}

export function agentResult(result: ExecuteAgentResult): ExecuteAgentResult {
    return result;
}

export function childFrame(
    frame: Omit<StackFrame, 'startedAt' | 'updatedAt' | 'status'> & {
        status?: StackFrame['status'];
    },
): StackFrame {
    return {
        ...frame,
        startedAt: anyDate(),
        updatedAt: anyDate(),
        parent: expect.any(Object) as StackFrame,
        status: frame.status || 'running',
    };
}

export function completedFrame(
    frame: Omit<StackFrame, 'startedAt' | 'updatedAt' | 'status'>,
): StackFrame {
    return childFrame({
        ...frame,
        status: 'finished',
    });
}

export function anyNumber() {
    return expect.any(Number) as number;
}

export function anyDate() {
    return expect.any(Date) as Date;
}
