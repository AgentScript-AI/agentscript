import { describe, expect, test } from 'vitest';

import * as s from '@agentscript-ai/schema';

import { createAgent } from '../../agent/createAgent.js';
import { parseScript } from '../../parser/parseScript.js';
import { defineTool } from '../../tools/defineTool.js';
import { executeAgent } from '../executeAgent.js';
import { agentResult, childFrame, completedFrame, rootFrame } from './testUtils.js';

const add = defineTool({
    description: 'Add two numbers',
    input: {
        a: s.number(),
        b: s.number(),
    },
    output: s.number(),
    handler: ({ input: { a, b } }) => Promise.resolve(a + b),
});

const multiply = defineTool({
    description: 'Multiply two numbers',
    input: {
        a: s.number(),
        b: s.number(),
    },
    output: s.number(),
    handler: ({ input: { a, b } }) => Promise.resolve(a * b),
});

const square = defineTool({
    description: 'Square a number',
    input: {
        a: s.number(),
    },
    output: s.number(),
    handler: ({ input: { a } }) => Promise.resolve(a * a),
});

const tools = {
    add,
    multiply,
    square,
};

test('single function call', async () => {
    const script = parseScript([
        //
        'add(1, 2);',
    ]);

    const agent = createAgent({ tools, script });

    const result = await executeAgent({ agent });
    const expectedStack = rootFrame({
        status: 'finished',
        children: [
            completedFrame({
                trace: '0:0',
                value: 3,
                children: [
                    completedFrame({ trace: '0:0:0', value: 1 }),
                    completedFrame({ trace: '0:0:1', value: 2 }),
                ],
            }),
        ],
    });

    expect(result).toEqual(agentResult({ ticks: 1 }));
    expect(agent.root).toEqual(expectedStack);
    expect(agent.status).toBe('finished');
});

test('multiple function calls', async () => {
    const script = parseScript([
        'const a = 1;',
        'const b = 2;',
        'const c = add(a, b);',
        'const d = multiply(c, 3);',
    ]);

    const agent = createAgent({ tools, script });

    let result = await executeAgent({ agent, ticks: 3 });
    const expectedStack = rootFrame({
        status: 'finished',
        variables: {
            a: 1,
            b: 2,
            c: 3,
            d: 9,
        },
        children: [
            //
            completedFrame({
                trace: '0:0',
                children: [completedFrame({ trace: '0:0:0', value: 1 })],
            }),
            completedFrame({
                trace: '0:1',
                children: [completedFrame({ trace: '0:1:0', value: 2 })],
            }),
            completedFrame({
                trace: '0:2',
                children: [
                    completedFrame({
                        trace: '0:2:0',
                        value: 3,
                        children: [
                            completedFrame({ trace: '0:2:0:0', value: 1 }),
                            completedFrame({ trace: '0:2:0:1', value: 2 }),
                        ],
                    }),
                ],
            }),
            completedFrame({
                trace: '0:3',
                children: [
                    completedFrame({
                        trace: '0:3:0',
                        value: 9,
                        children: [
                            completedFrame({ trace: '0:3:0:0', value: 3 }),
                            completedFrame({ trace: '0:3:0:1', value: 3 }),
                        ],
                    }),
                ],
            }),
        ],
    });

    expect(result).toEqual(agentResult({ ticks: 2 }));
    expect(agent.root).toEqual(expectedStack);
    expect(agent.status).toBe('finished');

    result = await executeAgent({ agent, ticks: 1 });
    expect(result).toEqual(agentResult({ ticks: 0 }));
    expect(agent.root).toEqual(expectedStack);
    expect(agent.status).toBe('finished');
});

describe('nested function calls', () => {
    const script = parseScript(['add(square(1), square(2));']);

    test('run one tick at a time', async () => {
        const agent = createAgent({ tools, script });

        let result = await executeAgent({ agent, ticks: 1 });
        let expectedStack = rootFrame({
            children: [
                childFrame({
                    trace: '0:0',
                    children: [
                        completedFrame({
                            trace: '0:0:0',
                            value: 1,
                            children: [completedFrame({ trace: '0:0:0:0', value: 1 })],
                        }),
                    ],
                }),
            ],
        });

        expect(result).toEqual(agentResult({ ticks: 1 }));
        expect(agent.root).toEqual(expectedStack);
        expect(agent.status).toBe('running');

        result = await executeAgent({ agent, ticks: 1 });
        expectedStack = rootFrame({
            children: [
                childFrame({
                    trace: '0:0',
                    children: [
                        completedFrame({
                            trace: '0:0:0',
                            value: 1,
                            children: [completedFrame({ trace: '0:0:0:0', value: 1 })],
                        }),
                        completedFrame({
                            trace: '0:0:1',
                            value: 4,
                            children: [completedFrame({ trace: '0:0:1:0', value: 2 })],
                        }),
                    ],
                }),
            ],
        });

        expect(result).toEqual(agentResult({ ticks: 1 }));

        result = await executeAgent({ agent, ticks: 1 });
        expectedStack = rootFrame({
            status: 'finished',
            children: [
                completedFrame({
                    trace: '0:0',
                    value: 5,
                    children: [
                        completedFrame({
                            trace: '0:0:0',
                            value: 1,
                            children: [completedFrame({ trace: '0:0:0:0', value: 1 })],
                        }),
                        completedFrame({
                            trace: '0:0:1',
                            value: 4,
                            children: [completedFrame({ trace: '0:0:1:0', value: 2 })],
                        }),
                    ],
                }),
            ],
        });
        expect(result).toEqual(agentResult({ ticks: 1 }));
        expect(agent.root).toEqual(expectedStack);
        expect(agent.status).toBe('finished');
    });

    test('run all ticks', async () => {
        const agent = createAgent({ tools, script });

        const result = await executeAgent({ agent });
        const expectedStack = rootFrame({
            status: 'finished',
            children: [
                completedFrame({
                    trace: '0:0',
                    value: 5,
                    children: [
                        completedFrame({
                            trace: '0:0:0',
                            value: 1,
                            children: [completedFrame({ trace: '0:0:0:0', value: 1 })],
                        }),
                        completedFrame({
                            trace: '0:0:1',
                            value: 4,
                            children: [completedFrame({ trace: '0:0:1:0', value: 2 })],
                        }),
                    ],
                }),
            ],
        });

        expect(result).toEqual(agentResult({ ticks: 3 }));
        expect(agent.root).toEqual(expectedStack);
        expect(agent.status).toBe('finished');
    });
});

test('module function', async () => {
    const script = parseScript(['utils.add(1, 2);']);

    const agent = createAgent({
        tools: {
            utils: tools,
        },
        script,
    });

    const result = await executeAgent({ agent });

    const expectedStack = rootFrame({
        status: 'finished',
        children: [
            completedFrame({
                trace: '0:0',
                value: 3,
                children: [
                    completedFrame({ trace: '0:0:0', value: 1 }),
                    completedFrame({ trace: '0:0:1', value: 2 }),
                ],
            }),
        ],
    });

    expect(result).toEqual(agentResult({ ticks: 1 }));
    expect(agent.root).toEqual(expectedStack);
    expect(agent.status).toBe('finished');
});

test('new Date()', async () => {
    const script = parseScript('new Date()');

    const agent = createAgent({ tools, script });

    const result = await executeAgent({ agent });
    const expectedStack = rootFrame({
        status: 'finished',
        children: [
            completedFrame({
                trace: '0:0',
                value: expect.any(Date),
            }),
        ],
    });

    expect(result).toEqual(agentResult({ ticks: 0 }));
    expect(agent.root).toEqual(expectedStack);
    expect(agent.status).toBe('finished');
});

test('toString()', async () => {
    const script = parseScript('true.toString()');

    const agent = createAgent({ tools, script });
    const result = await executeAgent({ agent });

    const expectedStack = rootFrame({
        status: 'finished',
        children: [
            completedFrame({
                trace: '0:0',
                value: 'true',
            }),
        ],
    });

    expect(result).toEqual(agentResult({ ticks: 0 }));
    expect(agent.root).toEqual(expectedStack);
    expect(agent.status).toBe('finished');
});

test('Number()', async () => {
    const script = parseScript('Number("1")');
    const agent = createAgent({ tools, script });

    const result = await executeAgent({ agent });

    const expectedStack = rootFrame({
        status: 'finished',
        children: [
            completedFrame({
                trace: '0:0',
                value: 1,
                children: [completedFrame({ trace: '0:0:0', value: '1' })],
            }),
        ],
    });

    expect(result).toEqual(agentResult({ ticks: 0 }));
    expect(agent.root).toEqual(expectedStack);
    expect(agent.status).toBe('finished');
});

test('Boolean()', async () => {
    const script = parseScript('Boolean("true")');
    const agent = createAgent({ tools, script });
    const result = await executeAgent({ agent });

    const expectedStack = rootFrame({
        status: 'finished',
        children: [
            completedFrame({
                trace: '0:0',
                value: true,
                children: [completedFrame({ trace: '0:0:0', value: 'true' })],
            }),
        ],
    });

    expect(result).toEqual(agentResult({ ticks: 0 }));
    expect(agent.root).toEqual(expectedStack);
    expect(agent.status).toBe('finished');
});

test('String()', async () => {
    const script = parseScript('String(1)');
    const agent = createAgent({ tools, script });
    const result = await executeAgent({ agent });

    const expectedStack = rootFrame({
        status: 'finished',
        children: [
            completedFrame({
                trace: '0:0',
                value: '1',
                children: [completedFrame({ trace: '0:0:0', value: 1 })],
            }),
        ],
    });

    expect(result).toEqual(agentResult({ ticks: 0 }));
    expect(agent.root).toEqual(expectedStack);
    expect(agent.status).toBe('finished');
});

test('array.push()', async () => {
    const script = parseScript([
        //
        'const a = [1, 2, 3];',
        'a.push(4);',
    ]);

    const agent = createAgent({ tools, script });
    const result = await executeAgent({ agent });

    const expectedStack = rootFrame({
        status: 'finished',
        children: [
            completedFrame({
                trace: '0:0',
                children: [
                    completedFrame({
                        trace: '0:0:0',
                        value: [1, 2, 3, 4],
                    }),
                ],
            }),
            completedFrame({
                trace: '0:1',
                value: 4,
                children: [
                    //
                    completedFrame({ trace: '0:1:0', value: 4 }),
                ],
            }),
        ],
        variables: { a: [1, 2, 3, 4] },
    });

    expect(result).toEqual(agentResult({ ticks: 0 }));
    expect(agent.root).toEqual(expectedStack);
    expect(agent.status).toBe('finished');
});

test('more than two arguments are turned into a single arg', async () => {
    const add = defineTool({
        description: 'Add three numbers',
        input: {
            a: s.number(),
            b: s.number(),
            c: s.number(),
        },
        output: s.number(),
        handler({ input }) {
            return input.a + input.b + input.c;
        },
    });

    const ast = parseScript('add({ a: 1, b: 2, c: 3 })');
    const agent = createAgent({
        tools: { add },
        script: ast,
    });
    const result = await executeAgent({ agent });

    const expectedStack = rootFrame({
        status: 'finished',
        children: [
            completedFrame({
                trace: '0:0',
                value: 6,
                children: [
                    completedFrame({
                        trace: '0:0:0',
                        value: { a: 1, b: 2, c: 3 },
                    }),
                ],
            }),
        ],
    });

    expect(result).toEqual(agentResult({ ticks: 0 }));
    expect(agent.root).toEqual(expectedStack);
    expect(agent.status).toBe('finished');
});

test('explicit single arg', async () => {
    const add = defineTool({
        description: 'Add three numbers',
        input: s.object({
            props: {
                a: s.number(),
                b: s.number(),
            },
        }),
        output: s.number(),
        handler({ input }) {
            return input.a + input.b;
        },
    });

    const ast = parseScript('add({ a: 1, b: 2 })');
    const agent = createAgent({
        tools: { add },
        script: ast,
    });
    const result = await executeAgent({ agent });

    const expectedStack = rootFrame({
        status: 'finished',
        children: [
            completedFrame({
                trace: '0:0',
                value: 3,
                children: [
                    completedFrame({
                        trace: '0:0:0',
                        value: { a: 1, b: 2 },
                    }),
                ],
            }),
        ],
    });

    expect(result).toEqual(agentResult({ ticks: 0 }));
    expect(agent.root).toEqual(expectedStack);
    expect(agent.status).toBe('finished');
});

test('agent output', async () => {
    const ast = parseScript('result = add(1, 2)');
    const agent = createAgent({
        tools: { add },
        output: s.number(),
        script: ast,
    });
    const result = await executeAgent({ agent });

    const expectedStack = rootFrame({
        status: 'finished',

        children: [
            completedFrame({
                trace: '0:0',
                children: [
                    completedFrame({
                        trace: '0:0:0',
                        value: 3,
                        children: [
                            completedFrame({ trace: '0:0:0:0', value: 1 }),
                            completedFrame({ trace: '0:0:0:1', value: 2 }),
                        ],
                    }),
                ],
            }),
        ],
        variables: { result: 3 },
    });

    expect(result).toEqual(agentResult({ ticks: 1 }));
    expect(agent.root).toEqual(expectedStack);
    expect(agent.status).toBe('finished');
    expect(agent.output).toBe(3);
});
