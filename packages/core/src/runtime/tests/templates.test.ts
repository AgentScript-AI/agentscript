import { expect, test } from 'vitest';

import { joinLines } from '@agentscript-ai/utils';

import { createAgent } from '../../agent/createAgent.js';
import { parseScript } from '../../parser/parseScript.js';
import { executeAgent } from '../executeAgent.js';
import { completedFrame, rootFrame } from './testUtils.js';

test('template literal without interpolation', async () => {
    const code = '`Hello, world!`';
    const script = parseScript(code);

    const agent = createAgent({ tools: {}, script });
    await executeAgent({ agent });

    const expectedStack = rootFrame({
        status: 'finished',
        children: [
            completedFrame({
                node: 'template',
                value: 'Hello, world!',
            }),
        ],
    });

    expect(agent.root).toEqual(expectedStack);
});

test('template literal with var interpolation in the middle', async () => {
    const code = joinLines([
        //
        'const name = "John"',
        'const greeting = `Hello, ${name}!`',
    ]);

    const script = parseScript(code);

    const agent = createAgent({
        tools: {},
        script,
    });

    await executeAgent({ agent });

    const expectedStack = rootFrame({
        status: 'finished',
        children: [
            completedFrame({ node: 'var' }),
            completedFrame({
                node: 'var',
                children: [
                    completedFrame({
                        node: 'template',
                        value: 'Hello, John!',
                        children: [
                            completedFrame({
                                node: 'ident',
                                value: 'John',
                            }),
                        ],
                    }),
                ],
            }),
        ],
        variables: {
            name: 'John',
            greeting: 'Hello, John!',
        },
    });

    expect(agent.root).toEqual(expectedStack);
    expect(agent.status).toBe('finished');
});

test('template literal with var interpolation at the end', async () => {
    const code = joinLines([
        //
        'const name = "John"',
        'const greeting = `Hello, ${name}`;',
    ]);

    const script = parseScript(code);

    const agent = createAgent({
        tools: {},
        script,
    });

    await executeAgent({ agent });

    const expectedStack = rootFrame({
        status: 'finished',
        children: [
            completedFrame({ node: 'var' }),
            completedFrame({
                node: 'var',
                children: [
                    completedFrame({
                        node: 'template',
                        value: 'Hello, John',
                        children: [
                            completedFrame({
                                node: 'ident',
                                value: 'John',
                            }),
                        ],
                    }),
                ],
            }),
        ],
        variables: {
            name: 'John',
            greeting: 'Hello, John',
        },
    });

    expect(agent.root).toEqual(expectedStack);
    expect(agent.status).toBe('finished');
});

test('template literal with var interpolation at the beginning', async () => {
    const code = joinLines([
        //
        'const name = "John"',
        'const greeting = `${name}, hello!`',
    ]);

    const script = parseScript(code);

    const agent = createAgent({
        tools: {},
        script,
    });

    await executeAgent({ agent });

    const expectedStack = rootFrame({
        status: 'finished',
        children: [
            completedFrame({ node: 'var' }),
            completedFrame({
                node: 'var',
                children: [
                    completedFrame({
                        node: 'template',
                        value: 'John, hello!',
                        children: [
                            completedFrame({
                                node: 'ident',
                                value: 'John',
                            }),
                        ],
                    }),
                ],
            }),
        ],
        variables: {
            name: 'John',
            greeting: 'John, hello!',
        },
    });

    expect(agent.root).toEqual(expectedStack);
});

test('template literal with function call', async () => {
    const code = joinLines([
        //
        'const name = "John"',
        'const greeting = `Hello, ${name.toUpperCase()}!`',
    ]);

    const script = parseScript(code);

    const agent = createAgent({
        tools: {},
        script,
    });

    await executeAgent({ agent });

    const expectedStack = rootFrame({
        status: 'finished',
        children: [
            completedFrame({ node: 'var' }),
            completedFrame({
                node: 'var',
                children: [
                    completedFrame({
                        node: 'template',
                        value: 'Hello, JOHN!',
                        children: [
                            // toUpperCase()
                            completedFrame({
                                node: 'call',
                                value: 'JOHN',
                                children: [
                                    // this arg
                                    completedFrame({
                                        node: 'ident',
                                        value: 'John',
                                    }),
                                ],
                            }),
                        ],
                    }),
                ],
            }),
        ],
        variables: {
            name: 'John',
            greeting: 'Hello, JOHN!',
        },
    });

    expect(agent.root).toEqual(expectedStack);
});
