import { add } from 'date-fns';

import { defineTool } from '@agentscript.ai/core';
import * as s from '@agentscript.ai/schema';

import { Duration } from './types/Duration.js';

/**
 * Add a duration to a date.
 */
export const addToDate = defineTool({
    description: 'Add a duration to a date.',
    args: {
        date: s.date(),
        duration: Duration,
    },
    return: s.date(),
    types: {
        Duration,
    },
    handler: ({ args: { date, duration } }) => add(date, duration),
});
