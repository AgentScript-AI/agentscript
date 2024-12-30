import { expect, test } from 'vitest';

import * as s from '@agentscript/schema';

import { defineFunction } from '../../defineFunction.js';
import { parseScript } from '../../script/parseScript.js';
import { createRuntime } from '../createRuntime.js';
import { executeRuntime } from '../executeRuntime.js';
import { anyNumber, childFrame, rootFrame, runtimeResult } from './utils.test.js';

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

const module = {
    add,
    multiply,
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
                result: 3,
                children: [
                    childFrame({ completedAt: anyNumber(), result: 1 }),
                    childFrame({ completedAt: anyNumber(), result: 2 }),
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
                children: [childFrame({ completedAt: anyNumber(), result: 1 })],
            }),
            childFrame({
                completedAt: anyNumber(),
                children: [childFrame({ completedAt: anyNumber(), result: 2 })],
            }),
            childFrame({
                completedAt: anyNumber(),
                children: [
                    childFrame({
                        completedAt: anyNumber(),
                        result: 3,
                        children: [
                            childFrame({ completedAt: anyNumber(), result: 1 }),
                            childFrame({ completedAt: anyNumber(), result: 2 }),
                        ],
                    }),
                ],
            }),
            childFrame({
                completedAt: anyNumber(),
                children: [
                    childFrame({
                        completedAt: anyNumber(),
                        result: 9,
                        children: [
                            childFrame({ completedAt: anyNumber(), result: 3 }),
                            childFrame({ completedAt: anyNumber(), result: 3 }),
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
