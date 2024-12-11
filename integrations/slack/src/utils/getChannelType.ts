export function getChannelType(channelId: string) {
    return channelId.startsWith('D') ? 'dm' : 'channel';
}
