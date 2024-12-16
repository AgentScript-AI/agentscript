import * as z from 'zod';

import { defineInjectable } from '@nzyme/ioc';

import type { ChatMessageInfo, ChatMessageWithContent } from './models/ChatMessage.js';

export interface Chat {
    postMessage(params: ChatPostMessageParams): Promise<ChatMessageInfo>;
    updateMessage(params: ChatUpdateMessageParams): Promise<ChatMessageInfo>;
    getChannelType(channelId: string): ChatType;
    getMessages(params: ChatGetMessagesParams): Promise<ChatMessageWithContent[]>;
    getUser(userId: string): Promise<ChatUser>;
    getSelfUser(): Promise<ChatUser>;
}

export interface ChatActionButton {
    type: 'button';
    text: string;
    action: string;
    value: string;
    style?: 'primary' | 'danger';
}

export interface ChatActionsBlock {
    type: 'actions';
    elements: ChatActionButton[];
}

export interface ChatDividerBlock {
    type: 'divider';
}

export type ChatBlock = ChatActionsBlock | ChatDividerBlock;

export interface ChatPostMessageParams {
    channelId: string;
    threadId: string;
    blocks: (ChatBlock | string)[];
}

export interface ChatUpdateMessageParams extends ChatPostMessageParams {
    messageId: string;
}

export interface ChatGetMessagesParams {
    channelId: string;
    threadId: string;
    from?: Date;
}

export type ChatType = 'DM' | 'CHANNEL';

export type ChatUser = z.infer<typeof ChatUser>;
export const ChatUser = z.object({
    id: z.string(),
    type: z.enum(['HUMAN', 'BOT']),
    name: z.string(),
    email: z.string().optional(),
    description: z.string().optional(),
});

export const Chat = defineInjectable<Chat>({
    name: 'Chat',
});
