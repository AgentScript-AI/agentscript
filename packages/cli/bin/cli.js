#!/usr/bin/env node

import { execute, settings } from '@oclif/core';
import consola from 'consola';
import sourceMap from 'source-map-support';
import * as tsx from 'tsx/esm/api';
import dotenv from 'dotenv';

dotenv.config();
consola.wrapAll();
sourceMap.install();
console.log(process.cwd());
tsx.register();

const debug = process.env.DEBUG === 'true';

// In dev mode, always show stack traces
settings.debug = true;
settings.performanceEnabled = true;

// Set logging level
consola.level = debug ? 5 : 3;

const originalEmit = process.emit;
process.emit = function (name, data, ...args) {
    if (name === `warning` && typeof data === `object`) {
        if (data.name === 'ExperimentalWarning') {
            return false;
        }

        if (data.name === 'DeprecationWarning' && data.message.includes('punycode')) {
            return false;
        }
    }

    return originalEmit.apply(process, arguments);
};

// Start the CLI
await execute({ dir: import.meta.url });
