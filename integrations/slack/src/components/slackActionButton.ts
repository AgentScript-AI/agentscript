import type { Button } from '@slack/web-api';

export type SlackActionButton = {
    text: string;
    action: string;
    value: unknown;
    style?: Button['style'];
};

export function slackActionButton(options: SlackActionButton): Button {
    return {
        type: 'button',
        action_id: options.action,
        value: serializeValue(options.value),
        style: options.style,
        text: {
            type: 'plain_text',
            text: options.text,
        },
    };
}

function serializeValue(value: unknown) {
    if (typeof value === 'object') {
        return JSON.stringify(value);
    }

    return String(value);
}
