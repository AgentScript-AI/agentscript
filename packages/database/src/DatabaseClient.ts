import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';

import { defineService } from '@nzyme/ioc';

import * as db from './schema.js';

export const DatabaseClient = defineService({
    name: 'DatabaseClient',
    setup() {
        const url = String(process.env.DATABASE_URL);
        const driver = postgres(url);

        return drizzle(driver, {
            schema: db,
            logger: process.env.DATABASE_LOGGING === 'true',
        });
    },
});
