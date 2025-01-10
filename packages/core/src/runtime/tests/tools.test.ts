import { describe, expect, test } from 'vitest';

import * as s from '@agentscript-ai/schema';

import { defineTool } from '../../defineTool.js';
import { parseScript } from '../../parser/parseScript.js';
import { createAgent } from '../createAgent.js';
import { executeAgent } from '../executeAgent.js';
import { agentResult, anyDate, childFrame, completedFrame, rootFrame } from './testUtils.js';

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
        completedAt: anyDate(),
        children: [
            completedFrame({
                value: 3,
                children: [completedFrame({ value: 1 }), completedFrame({ value: 2 })],
            }),
        ],
    });

    expect(result).toEqual(agentResult({ ticks: 1, done: true }));
    expect(agent.state?.root).toEqual(expectedStack);
    expect(agent.state?.complete).toBe(true);
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
        completedAt: anyDate(),
        variables: {
            a: 1,
            b: 2,
            c: 3,
            d: 9,
        },
        children: [
            //
            completedFrame({
                children: [completedFrame({ value: 1 })],
            }),
            completedFrame({
                children: [completedFrame({ value: 2 })],
            }),
            completedFrame({
                children: [
                    completedFrame({
                        value: 3,
                        children: [completedFrame({ value: 1 }), completedFrame({ value: 2 })],
                    }),
                ],
            }),
            completedFrame({
                children: [
                    completedFrame({
                        value: 9,
                        children: [completedFrame({ value: 3 }), completedFrame({ value: 3 })],
                    }),
                ],
            }),
        ],
    });

    expect(result).toEqual(agentResult({ ticks: 2, done: true }));
    expect(agent.state?.root).toEqual(expectedStack);
    expect(agent.state?.complete).toBe(true);

    result = await executeAgent({ agent, ticks: 1 });
    expect(result).toEqual(
        agentResult({
            ticks: 0,
            done: true,
        }),
    );
    expect(agent.state?.root).toEqual(expectedStack);
    expect(agent.state?.complete).toBe(true);
});

describe('nested function calls', () => {
    const script = parseScript(['add(square(1), square(2));']);

    test('run one tick at a time', async () => {
        const agent = createAgent({ tools, script });

        let result = await executeAgent({ agent, ticks: 1 });
        let expectedStack = rootFrame({
            children: [
                childFrame({
                    children: [
                        completedFrame({
                            value: 1,
                            children: [completedFrame({ value: 1 })],
                        }),
                    ],
                }),
            ],
        });

        expect(result).toEqual(agentResult({ ticks: 1, done: false }));
        expect(agent.state?.root).toEqual(expectedStack);
        expect(agent.state?.complete).toBe(false);

        result = await executeAgent({ agent, ticks: 1 });
        expectedStack = rootFrame({
            children: [
                childFrame({
                    children: [
                        completedFrame({
                            value: 1,
                            children: [completedFrame({ value: 1 })],
                        }),
                        completedFrame({
                            value: 4,
                            children: [completedFrame({ value: 2 })],
                        }),
                    ],
                }),
            ],
        });

        expect(result).toEqual(agentResult({ ticks: 1, done: false }));

        result = await executeAgent({ agent, ticks: 1 });
        expectedStack = rootFrame({
            completedAt: anyDate(),
            children: [
                completedFrame({
                    value: 5,
                    children: [
                        completedFrame({
                            value: 1,
                            children: [completedFrame({ value: 1 })],
                        }),
                        completedFrame({
                            value: 4,
                            children: [completedFrame({ value: 2 })],
                        }),
                    ],
                }),
            ],
        });
        expect(result).toEqual(agentResult({ ticks: 1, done: true }));
        expect(agent.state?.root).toEqual(expectedStack);
        expect(agent.state?.complete).toBe(true);
    });

    test('run all ticks', async () => {
        const agent = createAgent({ tools, script });

        const result = await executeAgent({ agent });
        const expectedStack = rootFrame({
            completedAt: anyDate(),
            children: [
                completedFrame({
                    value: 5,
                    children: [
                        completedFrame({
                            value: 1,
                            children: [completedFrame({ value: 1 })],
                        }),
                        completedFrame({
                            value: 4,
                            children: [completedFrame({ value: 2 })],
                        }),
                    ],
                }),
            ],
        });

        expect(result).toEqual(agentResult({ ticks: 3, done: true }));
        expect(agent.state?.root).toEqual(expectedStack);
        expect(agent.state?.complete).toBe(true);
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
        completedAt: anyDate(),
        children: [
            completedFrame({
                value: 3,
                children: [completedFrame({ value: 1 }), completedFrame({ value: 2 })],
            }),
        ],
    });

    expect(result).toEqual(agentResult({ ticks: 1, done: true }));
    expect(agent.state?.root).toEqual(expectedStack);
    expect(agent.state?.complete).toBe(true);
});

test('new Date()', async () => {
    const script = parseScript('new Date()');

    const agent = createAgent({ tools, script });

    const result = await executeAgent({ agent });
    const expectedStack = rootFrame({
        completedAt: anyDate(),
        children: [
            completedFrame({
                value: expect.any(Date),
            }),
        ],
    });

    expect(result).toEqual(agentResult({ ticks: 0, done: true }));
    expect(agent.state?.root).toEqual(expectedStack);
    expect(agent.state?.complete).toBe(true);
});

test('toString()', async () => {
    const script = parseScript('true.toString()');

    const agent = createAgent({ tools, script });
    const result = await executeAgent({ agent });

    const expectedStack = rootFrame({
        completedAt: anyDate(),
        children: [
            completedFrame({
                value: 'true',
            }),
        ],
    });

    expect(result).toEqual(agentResult({ ticks: 0, done: true }));
    expect(agent.state?.root).toEqual(expectedStack);
    expect(agent.state?.complete).toBe(true);
});

test('Number()', async () => {
    const script = parseScript('Number("1")');
    const agent = createAgent({ tools, script });

    const result = await executeAgent({ agent });

    const expectedStack = rootFrame({
        completedAt: anyDate(),
        children: [
            completedFrame({
                value: 1,
                children: [completedFrame({ value: '1' })],
            }),
        ],
    });

    expect(result).toEqual(agentResult({ ticks: 0, done: true }));
    expect(agent.state?.root).toEqual(expectedStack);
    expect(agent.state?.complete).toBe(true);
});

test('Boolean()', async () => {
    const script = parseScript('Boolean("true")');
    const agent = createAgent({ tools, script });
    const result = await executeAgent({ agent });

    const expectedStack = rootFrame({
        completedAt: anyDate(),
        children: [
            completedFrame({
                value: true,
                children: [completedFrame({ value: 'true' })],
            }),
        ],
    });

    expect(result).toEqual(agentResult({ ticks: 0, done: true }));
    expect(agent.state?.root).toEqual(expectedStack);
    expect(agent.state?.complete).toBe(true);
});

test('String()', async () => {
    const script = parseScript('String(1)');
    const agent = createAgent({ tools, script });
    const result = await executeAgent({ agent });

    const expectedStack = rootFrame({
        completedAt: anyDate(),
        children: [
            completedFrame({
                value: '1',
                children: [completedFrame({ value: 1 })],
            }),
        ],
    });

    expect(result).toEqual(agentResult({ ticks: 0, done: true }));
    expect(agent.state?.root).toEqual(expectedStack);
    expect(agent.state?.complete).toBe(true);
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
        completedAt: anyDate(),
        children: [
            completedFrame({
                children: [
                    completedFrame({
                        value: [1, 2, 3, 4],
                        children: [
                            completedFrame({ value: 1 }),
                            completedFrame({ value: 2 }),
                            completedFrame({ value: 3 }),
                        ],
                    }),
                ],
            }),
            completedFrame({
                value: 4,
                children: [
                    //
                    completedFrame({ value: 4 }),
                ],
            }),
        ],
        variables: { a: [1, 2, 3, 4] },
    });

    expect(result).toEqual(agentResult({ ticks: 0, done: true }));
    expect(agent.state?.root).toEqual(expectedStack);
    expect(agent.state?.complete).toBe(true);
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
        completedAt: anyDate(),
        children: [
            childFrame({
                completedAt: anyDate(),
                value: 6,
                children: [
                    childFrame({
                        completedAt: anyDate(),
                        value: { a: 1, b: 2, c: 3 },
                        children: [
                            childFrame({ completedAt: anyDate(), value: 1 }),
                            childFrame({ completedAt: anyDate(), value: 2 }),
                            childFrame({ completedAt: anyDate(), value: 3 }),
                        ],
                    }),
                ],
            }),
        ],
    });

    expect(result).toEqual(agentResult({ ticks: 0, done: true }));
    expect(agent.state?.root).toEqual(expectedStack);
    expect(agent.state?.complete).toBe(true);
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
        completedAt: anyDate(),
        children: [
            childFrame({
                completedAt: anyDate(),
                value: 3,
                children: [
                    childFrame({
                        completedAt: anyDate(),
                        value: { a: 1, b: 2 },
                        children: [
                            childFrame({ completedAt: anyDate(), value: 1 }),
                            childFrame({ completedAt: anyDate(), value: 2 }),
                        ],
                    }),
                ],
            }),
        ],
    });

    expect(result).toEqual(agentResult({ ticks: 0, done: true }));
    expect(agent.state?.root).toEqual(expectedStack);
    expect(agent.state?.complete).toBe(true);
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
        completedAt: anyDate(),
        children: [
            childFrame({
                completedAt: anyDate(),
                children: [
                    childFrame({
                        completedAt: anyDate(),
                        value: 3,
                        children: [
                            childFrame({ completedAt: anyDate(), value: 1 }),
                            childFrame({ completedAt: anyDate(), value: 2 }),
                        ],
                    }),
                ],
            }),
        ],
        variables: { result: 3 },
    });

    expect(result).toEqual(agentResult({ ticks: 1, done: true }));
    expect(agent.state?.root).toEqual(expectedStack);
    expect(agent.state?.complete).toBe(true);
    expect(agent.state?.output).toBe(3);
});
