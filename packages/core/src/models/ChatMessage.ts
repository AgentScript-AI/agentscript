import * as z from 'zod';

export type ChatMessageInfo = z.infer<typeof ChatMessageInfo>;
export const ChatMessageInfo = z.object({
    channelId: z.string(),
    threadId: z.string(),
    messageId: z.string(),
    userId: z.string(),
    timestamp: z.date(),
});

export type ChatMessageWithContent = z.infer<typeof ChatMessageWithContent>;
export const ChatMessageWithContent = ChatMessageInfo.extend({
    content: z.string(),
});
