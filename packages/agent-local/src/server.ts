import slack from '@slack/bolt';
import { install as installSourceMaps } from 'source-map-support';

import { SlackBot } from '@chorus/agent';
import { Chat, EnvVariables } from '@chorus/core';
import { SlackChat, SlackReceiver } from '@chorus/slack';
import { createContainer } from '@nzyme/ioc';
import { loadEnvVariables } from '@nzyme/project-utils';
import { devServerRuntime } from '@nzyme/rollup-utils';

installSourceMaps();
loadEnvVariables();

const runtime = devServerRuntime();
const container = createContainer();

const receiver = new slack.HTTPReceiver({
    signingSecret: String(process.env.SLACK_SIGNING_SECRET),
    port: runtime.port,
});

container.set(EnvVariables, process.env);
container.set(Chat, SlackChat);
container.set(SlackReceiver, receiver);

const slackApp = container.resolve(SlackBot);

await slackApp.start();

runtime.start();
