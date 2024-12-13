export function getChatId(channelId: string, threadId: string) {
    return `${channelId}:${threadId}`;
}
