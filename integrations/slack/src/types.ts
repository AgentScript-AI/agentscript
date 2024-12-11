import type { Block } from '@slack/web-api';

export type SlackText = (string | undefined | null | false)[] | string;
export type SlackBlock = Block;
