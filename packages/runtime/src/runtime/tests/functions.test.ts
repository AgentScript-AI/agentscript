import { describe, expect, test } from 'vitest';

import * as s from '@agentscript.ai/schema';

import { defineFunction } from '../../defineFunction.js';
import { parseScript } from '../../parser/parseScript.js';
import { createRuntime } from '../createRuntime.js';
import { executeRuntime } from '../executeRuntime.js';
import { anyNumber, childFrame, completedFrame, rootFrame, runtimeResult } from './testUtils.js';

const add = defineFunction({
    description: 'Add two numbers',
    args: {
        a: s.number(),
        b: s.number(),
    },
    return: s.number(),
    handler: ({ args: { a, b } }) => a + b,
});

const multiply = defineFunction({
    description: 'Multiply two numbers',
    args: {
        a: s.number(),
        b: s.number(),
    },
    return: s.number(),
    handler: ({ args: { a, b } }) => a * b,
});

const square = defineFunction({
    description: 'Square a number',
    args: {
        a: s.number(),
    },
    return: s.number(),
    handler: ({ args: { a } }) => a * a,
});

const module = {
    add,
    multiply,
    square,
};

test('single function call', async () => {
    const script = parseScript([
        //
        'add(1, 2);',
    ]);

    const runtime = createRuntime({
        module,
        script,
    });

    const result = await executeRuntime({ runtime });
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
    expect(runtime.stack).toEqual(expectedStack);
});

test('multiple function calls', async () => {
    const script = parseScript([
        'const a = 1;',
        'const b = 2;',
        'const c = add(a, b);',
        'const d = multiply(c, 3);',
    ]);

    const runtime = createRuntime({
        module,
        script,
    });

    let result = await executeRuntime({ runtime, maxTicks: 3 });
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
    expect(runtime.stack).toEqual(expectedStack);

    result = await executeRuntime({ runtime, maxTicks: 1 });
    expect(result).toEqual(
        runtimeResult({
            ticks: 0,
            done: true,
        }),
    );
    expect(runtime.stack).toEqual(expectedStack);
});

describe('nested function calls', () => {
    const script = parseScript(['add(square(1), square(2));']);

    test('run one tick at a time', async () => {
        const runtime = createRuntime({
            module,
            script,
        });

        let result = await executeRuntime({ runtime, maxTicks: 1 });
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
        expect(runtime.stack).toEqual(expectedStack);

        result = await executeRuntime({ runtime, maxTicks: 1 });
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

        result = await executeRuntime({ runtime, maxTicks: 1 });
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
        expect(runtime.stack).toEqual(expectedStack);
    });

    test('run all ticks', async () => {
        const runtime = createRuntime({
            module,
            script,
        });

        const result = await executeRuntime({ runtime });
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
        expect(runtime.stack).toEqual(expectedStack);
    });
});

test('module function', async () => {
    const script = parseScript(['utils.add(1, 2);']);

    const runtime = createRuntime({
        module: {
            utils: module,
        },
        script,
    });

    const result = await executeRuntime({ runtime });

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
    expect(runtime.stack).toEqual(expectedStack);
});

test('new Date()', async () => {
    const script = parseScript('new Date()');

    const runtime = createRuntime({
        module,
        script,
    });

    const result = await executeRuntime({ runtime });
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
    expect(runtime.stack).toEqual(expectedStack);
});

test('toString()', async () => {
    const script = parseScript('true.toString()');

    const runtime = createRuntime({ module, script });
    const result = await executeRuntime({ runtime });

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
    expect(runtime.stack).toEqual(expectedStack);
});

test('Number()', async () => {
    const script = parseScript('Number("1")');
    const runtime = createRuntime({ module, script });

    const result = await executeRuntime({ runtime });

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
    expect(runtime.stack).toEqual(expectedStack);
});

test('Boolean()', async () => {
    const script = parseScript('Boolean("true")');
    const runtime = createRuntime({ module, script });
    const result = await executeRuntime({ runtime });

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
    expect(runtime.stack).toEqual(expectedStack);
});

test('String()', async () => {
    const script = parseScript('String(1)');
    const runtime = createRuntime({ module, script });
    const result = await executeRuntime({ runtime });

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
    expect(runtime.stack).toEqual(expectedStack);
});

test('array.push()', async () => {
    const script = parseScript([
        //
        'const a = [1, 2, 3];',
        'a.push(4);',
    ]);

    const runtime = createRuntime({ module, script });
    const result = await executeRuntime({ runtime });

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
    expect(runtime.stack).toEqual(expectedStack);
});
