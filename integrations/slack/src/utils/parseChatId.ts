export function parseChatId(chatId: string) {
    const [channelId, threadId] = chatId.split(':');
    return { channelId, threadId };
}
