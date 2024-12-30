import { describe, expect, test } from 'vitest';
import * as z from 'zod';

import { createRuntime } from './createRuntime.js';
import { defineFunction } from '../defineFunction.js';
import type { RuntimeResult } from './executeRuntime.js';
import { executeRuntime } from './executeRuntime.js';
import type { StackFrame } from './stackTypes.js';
import { parseScript } from '../script/parseScript.js';

test('single variable declaration', async () => {
    const script = parseScript([
        //
        'const a = 1;',
    ]);

    const runtime = createRuntime({
        module: {},
        script,
    });

    let result = await executeRuntime({ runtime });

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
                children: [childFrame({ completedAt: anyNumber(), result: 1 })],
            }),
        ],
    });

    expect(runtime.stack).toEqual(expectedStack);

    result = await executeRuntime({ runtime });

    expect(result).toEqual(
        runtimeResult({
            ticks: 0,
            done: true,
        }),
    );
    expect(runtime.stack).toEqual(expectedStack);
});

test('multiple variable declarations', async () => {
    const script = parseScript([
        //
        'const a = 1;',
        'const b = 2;',
    ]);

    const runtime = createRuntime({
        module: {},
        script,
    });

    let result = await executeRuntime({ runtime });

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
                children: [childFrame({ completedAt: anyNumber(), result: 1 })],
            }),
            childFrame({
                completedAt: anyNumber(),
                children: [childFrame({ completedAt: anyNumber(), result: 2 })],
            }),
        ],
    });

    expect(runtime.stack).toEqual(expectedStack);

    result = await executeRuntime({ runtime });
    expect(result).toEqual(
        runtimeResult({
            ticks: 0,
            done: true,
        }),
    );
    expect(runtime.stack).toEqual(expectedStack);
});

describe('simple math', () => {
    const add = defineFunction({
        description: 'Add two numbers',
        args: {
            a: z.number(),
            b: z.number(),
        },
        return: z.number(),
        handler: ({ args: { a, b } }) => a + b,
    });

    const multiply = defineFunction({
        description: 'Multiply two numbers',
        args: {
            a: z.number(),
            b: z.number(),
        },
        return: z.number(),
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
});

function rootFrame(frame: Omit<StackFrame, 'startedAt'>): StackFrame {
    return {
        ...frame,
        startedAt: anyNumber(),
    };
}

function runtimeResult(result: RuntimeResult): RuntimeResult {
    return result;
}

function childFrame(frame: Omit<StackFrame, 'startedAt'>): StackFrame {
    return {
        ...frame,
        startedAt: anyNumber(),
        parent: expect.any(Object) as StackFrame,
    };
}

function anyNumber() {
    return expect.any(Number) as number;
}
