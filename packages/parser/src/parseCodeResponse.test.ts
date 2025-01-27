import { expect, test } from 'vitest';

import { joinLines } from '@agentscript-ai/utils';

import { ParseError } from './ParseError.js';
import { parseCodeResponse } from './parseCodeResponse.js';

test('code is wrapped in ```typescript```', () => {
    const response = joinLines([
        'This is a plan:',
        '1. Create a function that logs "Hello, world!"',
        '2. Call the function',
        '',
        'Here is the code:',
        '```typescript',
        '// Create a function that logs "Hello, world!"',
        'const hello = "Hello, world!";',
        '// Call the function',
        'console.log(hello);',
        '```',
    ]);

    const { plan, code } = parseCodeResponse(response);

    expect(plan).toBe(
        joinLines([
            'This is a plan:',
            '1. Create a function that logs "Hello, world!"',
            '2. Call the function',
            '',
            'Here is the code:',
        ]),
    );

    expect(code).toBe(
        joinLines([
            '// Create a function that logs "Hello, world!"',
            'const hello = "Hello, world!";',
            '// Call the function',
            'console.log(hello);',
        ]),
    );
});

test('code is nod wrapped in ```typescript```', () => {
    const response = joinLines([
        'This is a plan:',
        '1. Create a function that logs "Hello, world!"',
        '2. Call the function',
        '',
        'Here is the code:',
        '// Create a function that logs "Hello, world!"',
        'const hello = "Hello, world!";',
        '// Call the function',
        'console.log(hello);',
    ]);

    const { plan, code } = parseCodeResponse(response);

    expect(plan).toBe(
        joinLines([
            'This is a plan:',
            '1. Create a function that logs "Hello, world!"',
            '2. Call the function',
            '',
            'Here is the code:',
        ]),
    );

    expect(code).toBe(
        joinLines([
            '// Create a function that logs "Hello, world!"',
            'const hello = "Hello, world!";',
            '// Call the function',
            'console.log(hello);',
        ]),
    );
});

test('no code found', () => {
    const response = 'This is a plan:';

    expect(() => parseCodeResponse(response)).toThrow(ParseError);
});
