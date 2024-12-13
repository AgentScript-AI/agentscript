import * as z from 'zod';

import { AgentEvent } from './AgentEvent.js';

export type AgentState = z.infer<typeof AgentState>;
export const AgentState = z.object({
    id: z.string(),
    chatId: z.string(),
    events: z.array(AgentEvent),
});
