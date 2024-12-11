import { phoneLink } from '@nzyme/utils';

import { slackLink } from './slackLink.js';

export function slackPhone(phone: string): string {
    return slackLink(phoneLink(phone), phone);
}
