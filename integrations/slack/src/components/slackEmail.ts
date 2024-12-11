import { getMailToUrl } from '@nzyme/utils';

import { slackLink } from './slackLink.js';

export function slackEmail(email: string): string {
    return slackLink(getMailToUrl(email), email);
}
