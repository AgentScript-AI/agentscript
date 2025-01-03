import { describe, expect, test } from 'vitest';

import * as s from '@agentscript-ai/schema';

import { defineTool } from '../../defineTool.js';
import { parseScript } from '../../parser/parseScript.js';
import { createWorkflow } from '../createWorkflow.js';
import { executeWorkflow } from '../executeWorkflow.js';
import { anyNumber, childFrame, completedFrame, rootFrame, runtimeResult } from './testUtils.js';
import { defineRuntime } from '../../defineRuntime.js';

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

const runtime = defineRuntime({
    tools: {
        add,
        multiply,
        square,
    },
});

test('single function call', async () => {
    const script = parseScript([
        //
        'add(1, 2);',
    ]);

    const workflow = createWorkflow({ runtime, script });

    const result = await executeWorkflow({ workflow });
    const expectedStack = rootFrame({
        completedAt: anyNumber(),
        children: [
            childFrame({
                completedAt: anyNumber(),
                value: 3,
                children: [
                    childFrame({ completedAt: anyNumber(), value: 1 }),
                    childFrame({ completedAt: anyNumber(), value: 2 }),
                ],
            }),
        ],
    });

    expect(result).toEqual(runtimeResult({ ticks: 1, done: true }));
    expect(workflow.state?.root).toEqual(expectedStack);
    expect(workflow.state?.complete).toBe(true);
});

test('multiple function calls', async () => {
    const script = parseScript([
        'const a = 1;',
        'const b = 2;',
        'const c = add(a, b);',
        'const d = multiply(c, 3);',
    ]);

    const workflow = createWorkflow({ runtime, script });

    let result = await executeWorkflow({ workflow, maxTicks: 3 });
    const expectedStack = rootFrame({
        completedAt: anyNumber(),
        variables: {
            a: 1,
            b: 2,
            c: 3,
            d: 9,
        },
        children: [
            //
            childFrame({
                completedAt: anyNumber(),
                children: [childFrame({ completedAt: anyNumber(), value: 1 })],
            }),
            childFrame({
                completedAt: anyNumber(),
                children: [childFrame({ completedAt: anyNumber(), value: 2 })],
            }),
            childFrame({
                completedAt: anyNumber(),
                children: [
                    childFrame({
                        completedAt: anyNumber(),
                        value: 3,
                        children: [
                            childFrame({ completedAt: anyNumber(), value: 1 }),
                            childFrame({ completedAt: anyNumber(), value: 2 }),
                        ],
                    }),
                ],
            }),
            childFrame({
                completedAt: anyNumber(),
                children: [
                    childFrame({
                        completedAt: anyNumber(),
                        value: 9,
                        children: [
                            childFrame({ completedAt: anyNumber(), value: 3 }),
                            childFrame({ completedAt: anyNumber(), value: 3 }),
                        ],
                    }),
                ],
            }),
        ],
    });

    expect(result).toEqual(runtimeResult({ ticks: 2, done: true }));
    expect(workflow.state?.root).toEqual(expectedStack);
    expect(workflow.state?.complete).toBe(true);

    result = await executeWorkflow({ workflow, maxTicks: 1 });
    expect(result).toEqual(
        runtimeResult({
            ticks: 0,
            done: true,
        }),
    );
    expect(workflow.state?.root).toEqual(expectedStack);
    expect(workflow.state?.complete).toBe(true);
});

describe('nested function calls', () => {
    const script = parseScript(['add(square(1), square(2));']);

    test('run one tick at a time', async () => {
        const workflow = createWorkflow({ runtime, script });

        let result = await executeWorkflow({ workflow, maxTicks: 1 });
        let expectedStack = rootFrame({
            children: [
                childFrame({
                    children: [
                        childFrame({
                            completedAt: anyNumber(),
                            value: 1,
                            children: [childFrame({ completedAt: anyNumber(), value: 1 })],
                        }),
                    ],
                }),
            ],
        });

        expect(result).toEqual(runtimeResult({ ticks: 1, done: false }));
        expect(workflow.state?.root).toEqual(expectedStack);
        expect(workflow.state?.complete).toBe(false);

        result = await executeWorkflow({ workflow, maxTicks: 1 });
        expectedStack = rootFrame({
            children: [
                childFrame({
                    children: [
                        childFrame({
                            completedAt: anyNumber(),
                            value: 1,
                            children: [childFrame({ completedAt: anyNumber(), value: 1 })],
                        }),
                        childFrame({
                            completedAt: anyNumber(),
                            value: 4,
                            children: [childFrame({ completedAt: anyNumber(), value: 2 })],
                        }),
                    ],
                }),
            ],
        });

        expect(result).toEqual(runtimeResult({ ticks: 1, done: false }));

        result = await executeWorkflow({ workflow, maxTicks: 1 });
        expectedStack = rootFrame({
            completedAt: anyNumber(),
            children: [
                childFrame({
                    completedAt: anyNumber(),
                    value: 5,
                    children: [
                        childFrame({
                            completedAt: anyNumber(),
                            value: 1,
                            children: [childFrame({ completedAt: anyNumber(), value: 1 })],
                        }),
                        childFrame({
                            completedAt: anyNumber(),
                            value: 4,
                            children: [childFrame({ completedAt: anyNumber(), value: 2 })],
                        }),
                    ],
                }),
            ],
        });
        expect(result).toEqual(runtimeResult({ ticks: 1, done: true }));
        expect(workflow.state?.root).toEqual(expectedStack);
        expect(workflow.state?.complete).toBe(true);
    });

    test('run all ticks', async () => {
        const workflow = createWorkflow({ runtime, script });

        const result = await executeWorkflow({ workflow });
        const expectedStack = rootFrame({
            completedAt: anyNumber(),
            children: [
                childFrame({
                    completedAt: anyNumber(),
                    value: 5,
                    children: [
                        childFrame({
                            completedAt: anyNumber(),
                            value: 1,
                            children: [childFrame({ completedAt: anyNumber(), value: 1 })],
                        }),
                        childFrame({
                            completedAt: anyNumber(),
                            value: 4,
                            children: [childFrame({ completedAt: anyNumber(), value: 2 })],
                        }),
                    ],
                }),
            ],
        });

        expect(result).toEqual(runtimeResult({ ticks: 3, done: true }));
        expect(workflow.state?.root).toEqual(expectedStack);
        expect(workflow.state?.complete).toBe(true);
    });
});

test('module function', async () => {
    const script = parseScript(['utils.add(1, 2);']);

    const workflow = createWorkflow({
        runtime: {
            tools: {
                utils: runtime.tools,
            },
        },
        script,
    });

    const result = await executeWorkflow({ workflow });

    const expectedStack = rootFrame({
        completedAt: anyNumber(),
        children: [
            childFrame({
                completedAt: anyNumber(),
                value: 3,
                children: [
                    childFrame({ completedAt: anyNumber(), value: 1 }),
                    childFrame({ completedAt: anyNumber(), value: 2 }),
                ],
            }),
        ],
    });

    expect(result).toEqual(runtimeResult({ ticks: 1, done: true }));
    expect(workflow.state?.root).toEqual(expectedStack);
    expect(workflow.state?.complete).toBe(true);
});

test('new Date()', async () => {
    const script = parseScript('new Date()');

    const workflow = createWorkflow({
        runtime,
        script,
    });

    const result = await executeWorkflow({ workflow });
    const expectedStack = rootFrame({
        completedAt: anyNumber(),
        children: [
            childFrame({
                completedAt: anyNumber(),
                value: expect.any(Date),
            }),
        ],
    });

    expect(result).toEqual(runtimeResult({ ticks: 0, done: true }));
    expect(workflow.state?.root).toEqual(expectedStack);
    expect(workflow.state?.complete).toBe(true);
});

test('toString()', async () => {
    const script = parseScript('true.toString()');

    const workflow = createWorkflow({ runtime, script });
    const result = await executeWorkflow({ workflow });

    const expectedStack = rootFrame({
        completedAt: anyNumber(),
        children: [
            childFrame({
                completedAt: anyNumber(),
                value: 'true',
            }),
        ],
    });

    expect(result).toEqual(runtimeResult({ ticks: 0, done: true }));
    expect(workflow.state?.root).toEqual(expectedStack);
    expect(workflow.state?.complete).toBe(true);
});

test('Number()', async () => {
    const script = parseScript('Number("1")');
    const workflow = createWorkflow({ runtime, script });

    const result = await executeWorkflow({ workflow });

    const expectedStack = rootFrame({
        completedAt: anyNumber(),
        children: [
            completedFrame({
                value: 1,
                children: [completedFrame({ value: '1' })],
            }),
        ],
    });

    expect(result).toEqual(runtimeResult({ ticks: 0, done: true }));
    expect(workflow.state?.root).toEqual(expectedStack);
    expect(workflow.state?.complete).toBe(true);
});

test('Boolean()', async () => {
    const script = parseScript('Boolean("true")');
    const workflow = createWorkflow({ runtime, script });
    const result = await executeWorkflow({ workflow });

    const expectedStack = rootFrame({
        completedAt: anyNumber(),
        children: [
            completedFrame({
                value: true,
                children: [completedFrame({ value: 'true' })],
            }),
        ],
    });

    expect(result).toEqual(runtimeResult({ ticks: 0, done: true }));
    expect(workflow.state?.root).toEqual(expectedStack);
    expect(workflow.state?.complete).toBe(true);
});

test('String()', async () => {
    const script = parseScript('String(1)');
    const workflow = createWorkflow({ runtime, script });
    const result = await executeWorkflow({ workflow });

    const expectedStack = rootFrame({
        completedAt: anyNumber(),
        children: [
            completedFrame({
                value: '1',
                children: [completedFrame({ value: 1 })],
            }),
        ],
    });

    expect(result).toEqual(runtimeResult({ ticks: 0, done: true }));
    expect(workflow.state?.root).toEqual(expectedStack);
    expect(workflow.state?.complete).toBe(true);
});

test('array.push()', async () => {
    const script = parseScript([
        //
        'const a = [1, 2, 3];',
        'a.push(4);',
    ]);

    const workflow = createWorkflow({ runtime, script });
    const result = await executeWorkflow({ workflow });

    const expectedStack = rootFrame({
        completedAt: anyNumber(),
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

    expect(result).toEqual(runtimeResult({ ticks: 0, done: true }));
    expect(workflow.state?.root).toEqual(expectedStack);
    expect(workflow.state?.complete).toBe(true);
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

    const runtime = defineRuntime({
        tools: { add },
    });
    const ast = parseScript('add({ a: 1, b: 2, c: 3 })');
    const workflow = createWorkflow({ runtime, script: ast });
    const result = await executeWorkflow({ workflow });

    const expectedStack = rootFrame({
        completedAt: anyNumber(),
        children: [
            childFrame({
                completedAt: anyNumber(),
                value: 6,
                children: [
                    childFrame({
                        completedAt: anyNumber(),
                        value: { a: 1, b: 2, c: 3 },
                        children: [
                            childFrame({ completedAt: anyNumber(), value: 1 }),
                            childFrame({ completedAt: anyNumber(), value: 2 }),
                            childFrame({ completedAt: anyNumber(), value: 3 }),
                        ],
                    }),
                ],
            }),
        ],
    });

    expect(result).toEqual(runtimeResult({ ticks: 0, done: true }));
    expect(workflow.state?.root).toEqual(expectedStack);
    expect(workflow.state?.complete).toBe(true);
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
    const runtime = defineRuntime({
        tools: { add },
    });
    const workflow = createWorkflow({ runtime, script: ast });
    const result = await executeWorkflow({ workflow });

    const expectedStack = rootFrame({
        completedAt: anyNumber(),
        children: [
            childFrame({
                completedAt: anyNumber(),
                value: 3,
                children: [
                    childFrame({
                        completedAt: anyNumber(),
                        value: { a: 1, b: 2 },
                        children: [
                            childFrame({ completedAt: anyNumber(), value: 1 }),
                            childFrame({ completedAt: anyNumber(), value: 2 }),
                        ],
                    }),
                ],
            }),
        ],
    });

    expect(result).toEqual(runtimeResult({ ticks: 0, done: true }));
    expect(workflow.state?.root).toEqual(expectedStack);
    expect(workflow.state?.complete).toBe(true);
});

test('runtime output', async () => {
    const runtime = defineRuntime({
        tools: { add },
        output: s.number(),
    });

    const ast = parseScript('result = add(1, 2)');
    const workflow = createWorkflow({ runtime, script: ast });
    const result = await executeWorkflow({ workflow });

    const expectedStack = rootFrame({
        completedAt: anyNumber(),
        children: [
            childFrame({
                completedAt: anyNumber(),
                children: [
                    childFrame({
                        completedAt: anyNumber(),
                        value: 3,
                        children: [
                            childFrame({ completedAt: anyNumber(), value: 1 }),
                            childFrame({ completedAt: anyNumber(), value: 2 }),
                        ],
                    }),
                ],
            }),
        ],
        variables: { result: 3 },
    });

    expect(result).toEqual(runtimeResult({ ticks: 1, done: true }));
    expect(workflow.state?.root).toEqual(expectedStack);
    expect(workflow.state?.complete).toBe(true);
    expect(workflow.state?.output).toBe(3);
});
