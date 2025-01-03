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
    args: {
        a: s.number(),
        b: s.number(),
    },
    return: s.number(),
    handler: ({ args: { a, b } }) => a + b,
});

const multiply = defineTool({
    description: 'Multiply two numbers',
    args: {
        a: s.number(),
        b: s.number(),
    },
    return: s.number(),
    handler: ({ args: { a, b } }) => a * b,
});

const square = defineTool({
    description: 'Square a number',
    args: {
        a: s.number(),
    },
    return: s.number(),
    handler: ({ args: { a } }) => a * a,
});

const runtime = defineRuntime({
    add,
    multiply,
    square,
});

test('single function call', async () => {
    const script = parseScript([
        //
        'add(1, 2);',
    ]);

    const workflow = createWorkflow({ runtime, ast: script });

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
    expect(workflow.state).toEqual(expectedStack);
});

test('multiple function calls', async () => {
    const script = parseScript([
        'const a = 1;',
        'const b = 2;',
        'const c = add(a, b);',
        'const d = multiply(c, 3);',
    ]);

    const workflow = createWorkflow({ runtime, ast: script });

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
    expect(workflow.state).toEqual(expectedStack);

    result = await executeWorkflow({ workflow, maxTicks: 1 });
    expect(result).toEqual(
        runtimeResult({
            ticks: 0,
            done: true,
        }),
    );
    expect(workflow.state).toEqual(expectedStack);
});

describe('nested function calls', () => {
    const script = parseScript(['add(square(1), square(2));']);

    test('run one tick at a time', async () => {
        const workflow = createWorkflow({ runtime, ast: script });

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
        expect(workflow.state).toEqual(expectedStack);

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
        expect(workflow.state).toEqual(expectedStack);
    });

    test('run all ticks', async () => {
        const workflow = createWorkflow({ runtime, ast: script });

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
        expect(workflow.state).toEqual(expectedStack);
    });
});

test('module function', async () => {
    const script = parseScript(['utils.add(1, 2);']);

    const workflow = createWorkflow({
        runtime: {
            utils: runtime,
        },
        ast: script,
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
    expect(workflow.state).toEqual(expectedStack);
});

test('new Date()', async () => {
    const script = parseScript('new Date()');

    const workflow = createWorkflow({
        runtime,
        ast: script,
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
    expect(workflow.state).toEqual(expectedStack);
});

test('toString()', async () => {
    const script = parseScript('true.toString()');

    const workflow = createWorkflow({ runtime, ast: script });
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
    expect(workflow.state).toEqual(expectedStack);
});

test('Number()', async () => {
    const script = parseScript('Number("1")');
    const workflow = createWorkflow({ runtime, ast: script });

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
    expect(workflow.state).toEqual(expectedStack);
});

test('Boolean()', async () => {
    const script = parseScript('Boolean("true")');
    const workflow = createWorkflow({ runtime, ast: script });
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
    expect(workflow.state).toEqual(expectedStack);
});

test('String()', async () => {
    const script = parseScript('String(1)');
    const workflow = createWorkflow({ runtime, ast: script });
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
    expect(workflow.state).toEqual(expectedStack);
});

test('array.push()', async () => {
    const script = parseScript([
        //
        'const a = [1, 2, 3];',
        'a.push(4);',
    ]);

    const workflow = createWorkflow({ runtime, ast: script });
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
    expect(workflow.state).toEqual(expectedStack);
});
