import { test } from 'vitest';
import * as z from 'zod';

import { createRuntime } from './createRuntime.js';
import { defineFunction } from './defineFunction.js';
import { defineModule } from './defineModule.js';

test('simple runtime', () => {
    const User = z.object({
        name: z.string(),
        email: z.string().email(),
    });

    const getUser = defineFunction({
        description: 'Get a user',
        args: {
            id: z.string(),
        },
        return: z.promise(User),
        handler: ({ id }) => {
            return Promise.resolve({
                id,
                name: 'John',
                email: 'john@example.com',
            });
        },
    });

    const module = defineModule({
        User,
        getUser,
    });

    const runtime = createRuntime({
        modules: {
            Test: module,
        },
    });
});
