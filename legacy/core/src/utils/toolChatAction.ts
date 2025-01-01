import * as z from 'zod';

import type { ToolCall } from '../models/AgentEvent.js';

export const TOOL_CHAT_ACTION_TYPE = 'TOOL_INTERACTION';

export interface ToolChatActionParams {
    stateId: string;
    call: ToolCall;
    params: Record<string, unknown>;
}

export type ToolChatAction = z.infer<typeof ToolChatAction>;
export const ToolChatAction = z.object({
    stateId: z.string(),
    toolCallId: z.string(),
    params: z.record(z.unknown()),
});

export function toolChatAction(params: ToolChatActionParams) {
    const action: ToolChatAction = {
        stateId: params.stateId,
        toolCallId: params.call.uid,
        params: params.params,
    };

    return {
        action: TOOL_CHAT_ACTION_TYPE,
        value: JSON.stringify(action),
    };
}
