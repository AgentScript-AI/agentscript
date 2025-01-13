import type { AstNode } from '../../parser/astTypes.js';
import { RuntimeError } from '../RuntimeError.js';
import type { Agent } from '../../agent/agentTypes.js';
import type { StackFrame } from '../runtimeTypes.js';
import { getChild } from './getChild.js';

/**
 * Find a frame by trace.
 * @param agent - Agent to find the frame in.
 * @param trace - Trace to find the frame by.
 * @returns Frame found.
 */
export function findFrameByTrace(agent: Agent, trace: string) {
    const path = trace.split(':').map(Number);
    if (path.length < 2) {
        throw new RuntimeError(`Invalid trace: ${trace}`);
    }

    if (path[0] !== 0) {
        throw new RuntimeError(`Invalid trace: ${trace}`);
    }

    let index = path[1];
    let node: AstNode | undefined = agent.script.ast[index];
    let frame: StackFrame | undefined = agent.root.children?.[index];

    for (let i = 2; i < path.length; i++) {
        if (!node) {
            throw new RuntimeError(`Node not found at index for trace ${trace}`);
        }

        index = path[i];
        node = getChild(node, index);
        frame = frame?.children?.[index];
    }

    return {
        node,
        frame,
    };
}
