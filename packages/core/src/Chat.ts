import { defineInjectable } from '@nzyme/ioc';

export interface Chat {
    postMessage(params: ChatPostMessageParams): Promise<ChatMessageResult>;
    updateMessage(params: ChatUpdateMessageParams): Promise<ChatMessageResult>;
}

export interface ChatPostMessageParams {
    threadId: string;
    channelId: string;
    content: string;
}

export interface ChatUpdateMessageParams extends ChatPostMessageParams {
    messageId: string;
}

export interface ChatMessageResult {
    messageId: string;
}

export const Chat = defineInjectable<Chat>({
    name: 'Chat',
});
