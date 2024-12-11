import { pino } from 'pino';
import pretty from 'pino-pretty';

import { defineService } from '@nzyme/ioc';

export type Logger = pino.Logger;
export const Logger = defineService({
    name: 'Logger',
    resolution: 'transient',
    setup({ source }) {
        const stream = pretty({
            colorize: true,
        });

        const options: pino.LoggerOptions = {
            name: source?.name,
            level: 'debug',
        };

        return pino(options, stream);
    },
});
