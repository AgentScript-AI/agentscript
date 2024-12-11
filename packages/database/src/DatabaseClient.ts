import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';

import { EnvVariables } from '@chorus/core';
import { defineService } from '@nzyme/ioc';

import * as db from './schema.js';

export const DatabaseClient = defineService({
    name: 'DatabaseClient',
    setup({ inject }) {
        const env = inject(EnvVariables);
        const url = String(env.DATABASE_URL);
        const driver = postgres(url);

        return drizzle(driver, {
            schema: db,
            logger: env.DATABASE_LOGGING === 'true',
        });
    },
});
