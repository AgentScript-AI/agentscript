import slack from '@slack/bolt';
import { install as installSourceMaps } from 'source-map-support';

import { SlackBot } from '@chorus/agent';
import { SlackReceiver } from '@chorus/slack';
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

container.set(SlackReceiver, receiver);

const slackApp = container.resolve(SlackBot);

await slackApp.start();

runtime.start();
