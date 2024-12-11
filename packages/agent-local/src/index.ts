import { install as installSourceMaps } from 'source-map-support';

import { loadEnvVariables, resolveLocalPath } from '@nzyme/project-utils';
import { devServerConfig, devServerStart } from '@nzyme/rollup-utils';

installSourceMaps();
loadEnvVariables();

devServerStart({
    ...devServerConfig({
        input: resolveLocalPath(import.meta, './server.ts'),
        outputDir: resolveLocalPath(import.meta, '../dist'),
    }),
    port: 3001,
});
