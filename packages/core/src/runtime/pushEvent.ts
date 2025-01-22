import { validateOrThrow } from '@agentscript-ai/schema';
import * as s from '@agentscript-ai/schema';

import { RuntimeError } from './RuntimeError.js';
import type { Agent } from '../agent/agentTypes.js';
import { isTool } from '../tools/defineTool.js';
import { findFrameByTrace } from './utils/findFrameByTrace.js';
import { resolveFunctionCall } from './utils/resolveExpression.js';

/**
 * Options for {@link pushEvent}.
 */
export type PushEventOptions = {
    /**
     * Agent to push the event to.
     */
    agent: Agent;
    /**
     * Event to push.
     */
    event: unknown;
    /**
     * Trace of the event.
     */
    trace: string;
};

/**
 * Push an event to the agent.
 * @param options - Options for the event.
 * @deprecated Will probably change in the future.
 */
export function pushEvent(options: PushEventOptions) {
    const { agent, event, trace } = options;
    const { frame, node } = findFrameByTrace(agent, trace);
    if (!frame) {
        throw new RuntimeError(`Execution frame not found for trace: ${trace}`);
    }

    if (!node) {
        throw new RuntimeError(`AST node not found for trace: ${trace}`);
    }

    if (node.type !== 'call') {
        throw new RuntimeError(`AST node is not a call for trace: ${trace}`);
    }

    const { func, prop } = resolveFunctionCall(agent, frame, node);

    if (!isTool(func)) {
        throw new RuntimeError(`Function is not a tool for trace: ${trace}`);
    }

    if (!func.event) {
        throw new RuntimeError(`Tool ${prop} does not have event defined for trace: ${trace}`);
    }

    const payload = s.coerce(func.event, event);
    validateOrThrow(func.event, payload);

    if (!frame.events) {
        frame.events = [];
    }

    frame.events.push({
        timestamp: new Date(),
        payload,
        processed: false,
    });
}
