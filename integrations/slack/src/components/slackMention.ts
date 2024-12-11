export function slackMention(memberId: string | string[]): string {
    if (Array.isArray(memberId)) {
        return memberId.map(formatMention).join(', ');
    }

    return formatMention(memberId);
}

function formatMention(memberId: string): string {
    return `<@${memberId}>`;
}
