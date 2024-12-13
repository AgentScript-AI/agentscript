import { defineInjectable } from '@nzyme/ioc';

import type { ChatMessage } from './models/ChatMessage.js';

export interface Chat {
    postMessage(params: ChatPostMessageParams): Promise<ChatMessage>;
    updateMessage(params: ChatUpdateMessageParams): Promise<ChatMessage>;
    getChatInfo(chatId: string): ChatInfo;
}

export interface ChatButton {
    label: string;
    action: string;
    value: unknown;
    style?: 'primary' | 'danger';
}

export interface ChatPostMessageParams {
    chatId: string;
    content: string;
    buttons?: ChatButton[];
}

export interface ChatUpdateMessageParams extends ChatPostMessageParams {
    messageId: string;
}

export type ChatType = 'DM' | 'CHANNEL';

export interface ChatInfo {
    type: ChatType;
    prompt?: string;
}

export interface ChatUser {
    id: string;
    name: string;
    email?: string;
    description?: string;
}

export const Chat = defineInjectable<Chat>({
    name: 'Chat',
});
