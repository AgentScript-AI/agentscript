import type { DividerBlock } from '@slack/web-api';

export function slackDivider(): DividerBlock {
    return {
        type: 'divider',
    };
}
