import type { SectionBlock } from '@slack/web-api';

import { mapNotNull } from '@nzyme/utils';

import type { SlackText } from '../types.js';
import { joinLines } from '../utils/joinLines.js';

export type SlackSection = {
    text?: SlackText;
    fields?: (string | undefined | null | false)[];
};

export function slackSection(options: SlackSection): SectionBlock {
    return {
        type: 'section',
        text: options.text
            ? {
                  type: 'mrkdwn',
                  text: joinLines(options.text),
              }
            : undefined,
        fields: options.fields
            ? mapNotNull(options.fields, field => {
                  if (!field) {
                      return;
                  }

                  return {
                      type: 'mrkdwn',
                      text: field,
                  };
              })
            : undefined,
    };
}
