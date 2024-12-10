import path from 'node:path';

import { config as configDotenv } from 'dotenv';
import { defineConfig } from 'drizzle-kit';

configDotenv({
    path: path.resolve(__dirname, '../../.env'),
    override: true,
});

export default defineConfig({
    dialect: 'postgresql',
    schema: './src/schema',
    dbCredentials: {
        url: String(process.env.DATABASE_URL),
    },
});
