import type { Button } from '@slack/web-api';

export type SlackLinkButton = {
    text: string;
    url: string;
    style?: Button['style'];
};

export function slackLinkButton(options: SlackLinkButton): Button {
    return {
        type: 'button',
        url: options.url,
        style: options.style,
        text: {
            type: 'plain_text',
            text: options.text,
        },
    };
}
