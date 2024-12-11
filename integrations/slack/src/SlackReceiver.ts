import { Receiver } from '@slack/bolt';
import { defineInjectable } from '@nzyme/ioc';

export type SlackReceiver = Receiver;
export const SlackReceiver = defineInjectable<SlackReceiver>({
    name: 'SlackReceiver',
});
