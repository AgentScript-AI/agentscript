import * as z from 'zod';

import { ChatMessageInfo } from './ChatMessage.js';

export type AgentEventBase = z.infer<typeof AgentEventBase>;
export const AgentEventBase = z.object({
    type: z.string(),
    uid: z.string(),
    timestamp: z.date(),
    message: ChatMessageInfo.optional(),
});

export type HumanMessage = z.infer<typeof HumanMessage>;
export const HumanMessage = AgentEventBase.extend({
    type: z.literal('HUMAN_MESSAGE'),
    content: z.string(),
    message: ChatMessageInfo,
});

export type AgentMessage = z.infer<typeof AgentMessage>;
export const AgentMessage = AgentEventBase.extend({
    type: z.literal('AGENT_MESSAGE'),
    content: z.string(),
});

export type ToolCall = z.infer<typeof ToolCall>;
export const ToolCall = AgentEventBase.extend({
    type: z.literal('TOOL_CALL'),
    tool: z.string(),
    params: z.record(z.string(), z.unknown()),
    message: z.undefined().optional(),
});

export type ToolEvent = z.infer<typeof ToolEvent>;
export const ToolEvent = AgentEventBase.extend({
    type: z.literal('TOOL_EVENT'),
    content: z.string().optional(),
    data: z.unknown().nullish(),
    callId: z.string(),
    message: ChatMessageInfo.optional(),
});

export type AgentEvent = z.infer<typeof AgentEvent>;
export const AgentEvent = z.discriminatedUnion('type', [
    //
    HumanMessage,
    AgentMessage,
    ToolCall,
    ToolEvent,
]);
