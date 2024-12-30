import { LinearClient as Linear } from '@linear/sdk';

import { EnvVariables } from '@agentscript/core';
import { defineService } from '@nzyme/ioc';

export const LinearClient = defineService({
    name: 'LinearClient',
    setup({ inject }) {
        const env = inject(EnvVariables);

        return new Linear({
            apiKey: env.LINEAR_API_KEY,
        });
    },
});
