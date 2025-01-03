import { add } from 'date-fns';

import { defineTool } from '@agentscript-ai/core';
import * as s from '@agentscript-ai/schema';

import { Duration } from './types/Duration.js';

/**
 * Add a duration to a date.
 */
export const addToDate = defineTool({
    description: 'Add a duration to a date.',
    input: {
        date: s.date(),
        duration: Duration,
    },
    output: s.date(),
    types: {
        Duration,
    },
    handler: ({ input: { date, duration } }) => add(date, duration),
});
