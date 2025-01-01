import { expect, test } from 'vitest';

import { parseScript } from '../../parser/parseScript.js';
import { createWorkflow } from '../createWorkflow.js';
import { executeWorkflow } from '../executeWorkflow.js';
import { anyNumber, childFrame, completedFrame, rootFrame, runtimeResult } from './testUtils.js';

test('single variable declaration', async () => {
    const ast = parseScript([
        //
        'const a = 1;',
    ]);

    const workflow = createWorkflow({
        runtime: {},
        ast,
    });

    let result = await executeWorkflow({ workflow });

    expect(result).toEqual(
        runtimeResult({
            ticks: 0,
            done: true,
        }),
    );

    const expectedStack = rootFrame({
        completedAt: anyNumber(),
        variables: {
            a: 1,
        },
        children: [
            childFrame({
                completedAt: anyNumber(),
                children: [childFrame({ completedAt: anyNumber(), value: 1 })],
            }),
        ],
    });

    expect(workflow.state).toEqual(expectedStack);

    result = await executeWorkflow({ workflow });

    expect(result).toEqual(
        runtimeResult({
            ticks: 0,
            done: true,
        }),
    );
    expect(workflow.state).toEqual(expectedStack);
});

test('multiple variable declarations', async () => {
    const ast = parseScript([
        //
        'const a = 1;',
        'const b = 2;',
    ]);

    const workflow = createWorkflow({
        runtime: {},
        ast,
    });

    let result = await executeWorkflow({ workflow });

    expect(result).toEqual(
        runtimeResult({
            ticks: 0,
            done: true,
        }),
    );

    const expectedStack = rootFrame({
        completedAt: anyNumber(),
        variables: {
            a: 1,
            b: 2,
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
        ],
    });

    expect(workflow.state).toEqual(expectedStack);

    result = await executeWorkflow({ workflow });
    expect(result).toEqual(
        runtimeResult({
            ticks: 0,
            done: true,
        }),
    );
    expect(workflow.state).toEqual(expectedStack);
});

test('assign variable', async () => {
    const ast = parseScript(['let a = 1', 'a = 2;']);
    const workflow = createWorkflow({
        runtime: {},
        ast,
    });

    const result = await executeWorkflow({ workflow });

    const expectedStack = rootFrame({
        completedAt: anyNumber(),
        variables: { a: 2 },
        children: [
            completedFrame({
                children: [completedFrame({ value: 1 })],
            }),
            completedFrame({
                children: [completedFrame({ value: 2 })],
            }),
        ],
    });

    expect(result).toEqual(runtimeResult({ ticks: 0, done: true }));
    expect(workflow.state).toEqual(expectedStack);
});

test('member expression', async () => {
    const ast = parseScript([
        //
        'const a = { b: 1 };',
        'const c = a.b;',
    ]);

    const workflow = createWorkflow({
        runtime: {},
        ast,
    });

    const result = await executeWorkflow({ workflow });

    const expectedStack = rootFrame({
        completedAt: anyNumber(),
        variables: { a: { b: 1 }, c: 1 },
        children: [
            completedFrame({
                children: [
                    completedFrame({
                        value: { b: 1 },
                        children: [completedFrame({ value: 1 })],
                    }),
                ],
            }),
            completedFrame({
                children: [
                    completedFrame({
                        value: 1,
                        children: [
                            completedFrame({
                                value: { b: 1 },
                            }),
                        ],
                    }),
                ],
            }),
        ],
    });

    expect(result).toEqual(runtimeResult({ ticks: 0, done: true }));
    expect(workflow.state).toEqual(expectedStack);
});

test('array.length', async () => {
    const ast = parseScript([
        //
        'const a = [1, 2, 3];',
        'a.length;',
    ]);

    const workflow = createWorkflow({
        runtime: {},
        ast,
    });

    const result = await executeWorkflow({ workflow });

    const expectedStack = rootFrame({
        completedAt: anyNumber(),
        children: [
            completedFrame({
                children: [
                    completedFrame({
                        value: [1, 2, 3],
                        children: [
                            completedFrame({ value: 1 }),
                            completedFrame({ value: 2 }),
                            completedFrame({ value: 3 }),
                        ],
                    }),
                ],
            }),
            completedFrame({
                value: 3,
                children: [completedFrame({ value: [1, 2, 3] })],
            }),
        ],
        variables: { a: [1, 2, 3] },
    });

    expect(result).toEqual(runtimeResult({ ticks: 0, done: true }));
    expect(workflow.state).toEqual(expectedStack);
});
