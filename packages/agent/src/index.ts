import { install as installSourceMaps } from 'source-map-support';

import { createContainer } from '@nzyme/ioc';
import { loadEnvVariables } from '@nzyme/project-utils';

import { SlackBot } from './SlackBot.js';

installSourceMaps();
loadEnvVariables();

const container = createContainer();
const slackBot = container.resolve(SlackBot);

await slackBot.start();
