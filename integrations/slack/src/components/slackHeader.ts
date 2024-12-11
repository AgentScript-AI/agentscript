import type { HeaderBlock } from '@slack/web-api';

export function slackHeader(text: string): HeaderBlock {
    return {
        type: 'header',
        text: {
            type: 'plain_text',
            text: text,
        },
    };
}
