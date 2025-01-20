import { expect, test } from 'vitest';

import * as s from '@agentscript-ai/schema';
import { joinLines } from '@agentscript-ai/utils';

import { createAgent } from '../../agent/createAgent.js';
import { parseScript } from '../../parser/parseScript.js';
import { executeAgent } from '../executeAgent.js';
import { completedFrame, rootFrame } from './testUtils.js';
import { defineTool } from '../../tools/defineTool.js';

test('array map with inline arrow function', async () => {
    const code = joinLines([
        //
        'const a = [1, 2, 3]',
        'const b = a.map(x => x * 2)',
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
            // var a declaration
            completedFrame({
                trace: '0:0',
                children: [
                    // array literal
                    completedFrame({
                        trace: '0:0:0',
                        value: [1, 2, 3],
                    }),
                ],
            }),
            // var b declaration
            completedFrame({
                trace: '0:1',
                children: [
                    // array map call
                    completedFrame({
                        trace: '0:1:0',
                        value: [2, 4, 6],
                        children: [
                            // array map item / operator call
                            completedFrame({
                                trace: '0:1:0:0',
                                value: 2,
                                variables: {
                                    x: 1,
                                },
                                children: [
                                    // left operand
                                    completedFrame({
                                        trace: '0:1:0:0:0',
                                        value: 1,
                                    }),
                                    // right operand
                                    completedFrame({
                                        trace: '0:1:0:0:1',
                                        value: 2,
                                    }),
                                ],
                            }),
                            // array map item / operator call
                            completedFrame({
                                trace: '0:1:0:1',
                                value: 4,
                                variables: {
                                    x: 2,
                                },
                                children: [
                                    // left operand
                                    completedFrame({
                                        trace: '0:1:0:1:0',
                                        value: 2,
                                    }),
                                    // right operand
                                    completedFrame({
                                        trace: '0:1:0:1:1',
                                        value: 2,
                                    }),
                                ],
                            }),
                            // array map item / operator call
                            completedFrame({
                                trace: '0:1:0:2',
                                value: 6,
                                variables: {
                                    x: 3,
                                },
                                children: [
                                    // left operand
                                    completedFrame({
                                        trace: '0:1:0:2:0',
                                        value: 3,
                                    }),
                                    // right operand
                                    completedFrame({
                                        trace: '0:1:0:2:1',
                                        value: 2,
                                    }),
                                ],
                            }),
                        ],
                    }),
                ],
            }),
        ],
        variables: {
            a: [1, 2, 3],
            b: [2, 4, 6],
        },
    });

    expect(agent.root).toEqual(expectedStack);
    expect(agent.status).toBe('finished');
});

test('array map with block arrow function', async () => {
    const code = joinLines([
        //
        'const a = [1, 2, 3]',
        'const b = a.map(x => {',
        '    const y = x * 2',
        '    return y',
        '})',
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
            // var a declaration
            completedFrame({
                trace: '0:0',
                children: [
                    // array literal
                    completedFrame({
                        trace: '0:0:0',
                        value: [1, 2, 3],
                    }),
                ],
            }),
            // var b declaration
            completedFrame({
                trace: '0:1',
                children: [
                    // array map call
                    completedFrame({
                        trace: '0:1:0',
                        value: [2, 4, 6],
                        children: [
                            // array map item block
                            completedFrame({
                                trace: '0:1:0:0',
                                value: 2,
                                variables: {
                                    x: 1,
                                    y: 2,
                                },
                                children: [
                                    // var y declaration
                                    completedFrame({
                                        trace: '0:1:0:0:0',
                                        children: [
                                            // operator call
                                            completedFrame({
                                                trace: '0:1:0:0:0:0',
                                                value: 2,
                                                children: [
                                                    // left operand
                                                    completedFrame({
                                                        trace: '0:1:0:0:0:0:0',
                                                        value: 1,
                                                    }),
                                                    // right operand
                                                    completedFrame({
                                                        trace: '0:1:0:0:0:0:1',
                                                        value: 2,
                                                    }),
                                                ],
                                            }),
                                        ],
                                    }),
                                    // return statement
                                    completedFrame({
                                        trace: '0:1:0:0:1',
                                        value: 2,
                                    }),
                                ],
                            }),
                            // array map item block
                            completedFrame({
                                trace: '0:1:0:1',
                                value: 4,
                                variables: {
                                    x: 2,
                                    y: 4,
                                },
                                children: [
                                    // var y declaration
                                    completedFrame({
                                        trace: '0:1:0:1:0',
                                        children: [
                                            // operator call
                                            completedFrame({
                                                trace: '0:1:0:1:0:0',
                                                value: 4,
                                                children: [
                                                    // left operand
                                                    completedFrame({
                                                        trace: '0:1:0:1:0:0:0',
                                                        value: 2,
                                                    }),
                                                    // right operand
                                                    completedFrame({
                                                        trace: '0:1:0:1:0:0:1',
                                                        value: 2,
                                                    }),
                                                ],
                                            }),
                                        ],
                                    }),
                                    // return statement
                                    completedFrame({
                                        trace: '0:1:0:1:1',
                                        value: 4,
                                    }),
                                ],
                            }),
                            // array map item block
                            completedFrame({
                                trace: '0:1:0:2',
                                value: 6,
                                variables: {
                                    x: 3,
                                    y: 6,
                                },
                                children: [
                                    // var y declaration
                                    completedFrame({
                                        trace: '0:1:0:2:0',
                                        children: [
                                            // operator call
                                            completedFrame({
                                                trace: '0:1:0:2:0:0',
                                                value: 6,
                                                children: [
                                                    // left operand
                                                    completedFrame({
                                                        trace: '0:1:0:2:0:0:0',
                                                        value: 3,
                                                    }),
                                                    // right operand
                                                    completedFrame({
                                                        trace: '0:1:0:2:0:0:1',
                                                        value: 2,
                                                    }),
                                                ],
                                            }),
                                        ],
                                    }),
                                    // return statement
                                    completedFrame({
                                        trace: '0:1:0:2:1',
                                        value: 6,
                                    }),
                                ],
                            }),
                        ],
                    }),
                ],
            }),
        ],
        variables: {
            a: [1, 2, 3],
            b: [2, 4, 6],
        },
    });

    expect(agent.root).toEqual(expectedStack);
    expect(agent.status).toBe('finished');
});

test('array map with async tool inline', async () => {
    const multiply = defineTool({
        description: 'Multiplies two numbers',
        input: {
            x: s.number(),
            y: s.number(),
        },
        output: s.number(),
        handler: ({ input }) => {
            return Promise.resolve(input.x * input.y);
        },
    });

    const code = joinLines([
        //
        'const a = [1, 2, 3]',
        'const b = a.map(x => multiply(x, 2))',
    ]);

    const agent = createAgent({
        tools: { multiply },
        script: parseScript(code),
    });

    await executeAgent({ agent });

    const expectedStack = rootFrame({
        status: 'finished',
        children: [
            // var a declaration
            completedFrame({
                trace: '0:0',
                children: [
                    // array literal
                    completedFrame({
                        trace: '0:0:0',
                        value: [1, 2, 3],
                    }),
                ],
            }),
            // var b declaration
            completedFrame({
                trace: '0:1',
                children: [
                    // array map call
                    completedFrame({
                        trace: '0:1:0',
                        value: [2, 4, 6],
                        children: [
                            // array map item / tool call
                            completedFrame({
                                trace: '0:1:0:0',
                                value: 2,
                                variables: {
                                    x: 1,
                                },
                                children: [
                                    // first parameter
                                    completedFrame({
                                        trace: '0:1:0:0:0',
                                        value: 1,
                                    }),
                                    // second parameter
                                    completedFrame({
                                        trace: '0:1:0:0:1',
                                        value: 2,
                                    }),
                                ],
                            }),
                            // array map item / tool call
                            completedFrame({
                                trace: '0:1:0:1',
                                value: 4,
                                variables: {
                                    x: 2,
                                },
                                children: [
                                    // first parameter
                                    completedFrame({
                                        trace: '0:1:0:1:0',
                                        value: 2,
                                    }),
                                    // second parameter
                                    completedFrame({
                                        trace: '0:1:0:1:1',
                                        value: 2,
                                    }),
                                ],
                            }),
                            // array map item / operator call
                            completedFrame({
                                trace: '0:1:0:2',
                                value: 6,
                                variables: {
                                    x: 3,
                                },
                                children: [
                                    // first parameter
                                    completedFrame({
                                        trace: '0:1:0:2:0',
                                        value: 3,
                                    }),
                                    // second parameter
                                    completedFrame({
                                        trace: '0:1:0:2:1',
                                        value: 2,
                                    }),
                                ],
                            }),
                        ],
                    }),
                ],
            }),
        ],
        variables: {
            a: [1, 2, 3],
            b: [2, 4, 6],
        },
    });
    expect(agent.root).toEqual(expectedStack);
    expect(agent.status).toBe('finished');
});

test('array map with async tool in block', async () => {
    const multiply = defineTool({
        description: 'Multiplies two numbers',
        input: {
            x: s.number(),
            y: s.number(),
        },
        output: s.number(),
        handler: ({ input }) => {
            return Promise.resolve(input.x * input.y);
        },
    });

    const code = joinLines([
        //
        'const a = [1, 2, 3]',
        'const b = a.map(x => {',
        '    const y = multiply(x, 2)',
        '    return y',
        '})',
    ]);

    const agent = createAgent({
        tools: { multiply },
        script: parseScript(code),
    });

    await executeAgent({ agent });

    const expectedStack = rootFrame({
        status: 'finished',
        children: [
            // var a declaration
            completedFrame({
                trace: '0:0',
                children: [
                    // array literal
                    completedFrame({
                        trace: '0:0:0',
                        value: [1, 2, 3],
                    }),
                ],
            }),
            // var b declaration
            completedFrame({
                trace: '0:1',
                children: [
                    // array map call
                    completedFrame({
                        trace: '0:1:0',
                        value: [2, 4, 6],
                        children: [
                            // array map item block
                            completedFrame({
                                trace: '0:1:0:0',
                                value: 2,
                                variables: {
                                    x: 1,
                                    y: 2,
                                },
                                children: [
                                    // var y declaration
                                    completedFrame({
                                        trace: '0:1:0:0:0',
                                        children: [
                                            // tool call
                                            completedFrame({
                                                trace: '0:1:0:0:0:0',
                                                value: 2,
                                                children: [
                                                    // first parameter
                                                    completedFrame({
                                                        trace: '0:1:0:0:0:0:0',
                                                        value: 1,
                                                    }),
                                                    // second parameter
                                                    completedFrame({
                                                        trace: '0:1:0:0:0:0:1',
                                                        value: 2,
                                                    }),
                                                ],
                                            }),
                                        ],
                                    }),
                                    // return statement
                                    completedFrame({
                                        trace: '0:1:0:0:1',
                                        value: 2,
                                    }),
                                ],
                            }),
                            // array map item block
                            completedFrame({
                                trace: '0:1:0:1',
                                value: 4,
                                variables: {
                                    x: 2,
                                    y: 4,
                                },
                                children: [
                                    // var y declaration
                                    completedFrame({
                                        trace: '0:1:0:1:0',
                                        children: [
                                            // tool call
                                            completedFrame({
                                                trace: '0:1:0:1:0:0',
                                                value: 4,
                                                children: [
                                                    // first parameter
                                                    completedFrame({
                                                        trace: '0:1:0:1:0:0:0',
                                                        value: 2,
                                                    }),
                                                    // second parameter
                                                    completedFrame({
                                                        trace: '0:1:0:1:0:0:1',
                                                        value: 2,
                                                    }),
                                                ],
                                            }),
                                        ],
                                    }),
                                    // return statement
                                    completedFrame({
                                        trace: '0:1:0:1:1',
                                        value: 4,
                                    }),
                                ],
                            }),
                            // array map item block
                            completedFrame({
                                trace: '0:1:0:2',
                                value: 6,
                                variables: {
                                    x: 3,
                                    y: 6,
                                },
                                children: [
                                    // var y declaration
                                    completedFrame({
                                        trace: '0:1:0:2:0',
                                        children: [
                                            // tool call
                                            completedFrame({
                                                trace: '0:1:0:2:0:0',
                                                value: 6,
                                                children: [
                                                    // first parameter
                                                    completedFrame({
                                                        trace: '0:1:0:2:0:0:0',
                                                        value: 3,
                                                    }),
                                                    // second parameter
                                                    completedFrame({
                                                        trace: '0:1:0:2:0:0:1',
                                                        value: 2,
                                                    }),
                                                ],
                                            }),
                                        ],
                                    }),
                                    // return statement
                                    completedFrame({
                                        trace: '0:1:0:2:1',
                                        value: 6,
                                    }),
                                ],
                            }),
                        ],
                    }),
                ],
            }),
        ],
        variables: {
            a: [1, 2, 3],
            b: [2, 4, 6],
        },
    });

    expect(agent.root).toEqual(expectedStack);
    expect(agent.status).toBe('finished');
});
