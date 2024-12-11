import { defineInjectable } from '@nzyme/ioc';

export interface Chat {
    sendMessage(params: ChatMessageParams): Promise<ChatMessageResult>;
}

export interface ChatMessageParams {
    threadId: string;
    channelId: string;
    content: string;
}

export interface ChatMessageResult {
    messageId: string;
}

export const Chat = defineInjectable<Chat>({
    name: 'Chat',
});
