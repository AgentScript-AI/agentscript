/* eslint-disable jsdoc/require-jsdoc */
import { expect } from 'vitest';

import type { AstNode } from '@agentscript-ai/parser';

import type { ExecuteAgentResult } from '../executeAgent.js';
import type { StackFrame } from '../runtimeTypes.js';

export function rootFrame(
    frame: Omit<StackFrame, 'startedAt' | 'updatedAt' | 'trace' | 'status' | 'node'> & {
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
    frame: Omit<StackFrame, 'startedAt' | 'updatedAt' | 'trace' | 'status' | 'node'> & {
        status?: StackFrame['status'];
        node: AstNode['type'] | 'any';
    },
): StackFrame {
    const result: StackFrame = {
        ...frame,
        trace: expect.any(String) as string,
        startedAt: anyDate(),
        updatedAt: anyDate(),
        parent: expect.any(Object) as StackFrame,
        status: frame.status || 'running',
        node:
            frame.node === 'any'
                ? undefined
                : (expect.objectContaining({ type: frame.node }) as AstNode),
    };

    if (!result.node) {
        delete result.node;
    }

    return result;
}

export function completedFrame(
    frame: Omit<StackFrame, 'startedAt' | 'updatedAt' | 'trace' | 'status' | 'node'> & {
        node: AstNode['type'];
    },
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
