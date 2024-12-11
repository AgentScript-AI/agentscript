import type { SectionBlock } from '@slack/web-api';

import type { SlackText } from '../types.js';
import { joinLines } from '../utils/joinLines.js';

export type SlackFieldsSection = {
    text?: SlackText;
    fields: { [title: string]: unknown };
};

export function slackFieldsSection(options: SlackFieldsSection): SectionBlock {
    const fields: string[] = [];
    for (const key in options.fields) {
        fields.push(`*${key}:*\n${options.fields[key]?.toString() ?? ''}`);
    }

    return {
        type: 'section',
        text: options.text
            ? {
                  type: 'mrkdwn',
                  text: joinLines(options.text),
              }
            : undefined,
        fields: fields.map(field => ({
            type: 'mrkdwn',
            text: field,
        })),
    };
}
