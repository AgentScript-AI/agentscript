import { defineInjectable } from '@nzyme/ioc';

import type { ChatMessage } from './models/ChatMessage.js';

export interface Chat {
    postMessage(params: ChatPostMessageParams): Promise<ChatMessage>;
    updateMessage(params: ChatUpdateMessageParams): Promise<ChatMessage>;
    getChatInfo(chatId: string): ChatInfo;
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
    chatId: string;
    blocks: (ChatBlock | string)[];
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
