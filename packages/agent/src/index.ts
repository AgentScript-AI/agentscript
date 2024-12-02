import { config as configDotenv } from 'dotenv';
import { install as installSourceMaps } from 'source-map-support';

import { createContainer } from '@nzyme/ioc';

import { SlackBot } from './SlackBot.js';

installSourceMaps();
configDotenv();

const container = createContainer();
const slackBot = container.resolve(SlackBot);

await slackBot.start();
