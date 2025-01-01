import type { Receiver } from '@slack/bolt';

import { defineInterface } from '@nzyme/ioc';

export type SlackReceiver = Receiver;
export const SlackReceiver = defineInterface<SlackReceiver>({
    name: 'SlackReceiver',
});
