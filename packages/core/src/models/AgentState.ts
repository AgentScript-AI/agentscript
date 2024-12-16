import * as z from 'zod';

import { AgentEvent } from './AgentEvent.js';
import { ChatUser } from '../Chat.js';

export type AgentState = z.infer<typeof AgentState>;
export const AgentState = z.object({
    id: z.string(),
    channelId: z.string(),
    threadId: z.string(),
    events: z.array(AgentEvent),
    tools: z.record(z.string(), z.unknown()),
    users: z.record(z.string(), ChatUser),
});
