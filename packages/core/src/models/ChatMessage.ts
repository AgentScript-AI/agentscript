import * as z from 'zod';

export type ChatMessage = z.infer<typeof ChatMessage>;
export const ChatMessage = z.object({
    id: z.string(),
    chatId: z.string(),
});
