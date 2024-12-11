import type { ActionsBlock } from '@slack/web-api';

export type SlackActions = Omit<ActionsBlock, 'type'>;

export function slackActions(options: SlackActions): ActionsBlock {
    return {
        type: 'actions',
        ...options,
    };
}
