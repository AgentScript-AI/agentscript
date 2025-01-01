import { LinearClient as Linear } from '@linear/sdk';

import { EnvVariables } from '@agentscript.ai/core';
import { defineService } from '@nzyme/ioc';

export const LinearClient = defineService({
    name: 'LinearClient',
    deps: {
        env: EnvVariables,
    },
    setup({ env }) {
        return new Linear({
            apiKey: env.LINEAR_API_KEY,
        });
    },
});
