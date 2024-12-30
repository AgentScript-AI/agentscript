import { expect, test } from 'vitest';

import { parseScript } from '../../script/parseScript.js';
import { createRuntime } from '../createRuntime.js';
import { executeRuntime } from '../executeRuntime.js';
import { anyNumber, childFrame, rootFrame, runtimeResult } from './testUtils.js';

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

test('assign variable', async () => {
    const script = parseScript(['let a = 1', 'a = 2;']);
    const runtime = createRuntime({
        module: {},
        script,
    });

    const result = await executeRuntime({ runtime });

    const expectedStack = rootFrame({
        completedAt: anyNumber(),
        variables: { a: 2 },
        children: [
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

    expect(result).toEqual(runtimeResult({ ticks: 0, done: true }));
    expect(runtime.stack).toEqual(expectedStack);
});

test('member expression', async () => {
    const script = parseScript([
        //
        'const a = { b: 1 };',
        'const c = a.b;',
    ]);

    const runtime = createRuntime({
        module: {},
        script,
    });

    const result = await executeRuntime({ runtime });

    const expectedStack = rootFrame({
        completedAt: anyNumber(),
        variables: { a: { b: 1 }, c: 1 },
        children: [
            childFrame({
                completedAt: anyNumber(),
                children: [childFrame({ completedAt: anyNumber(), result: { b: 1 } })],
            }),
            childFrame({
                completedAt: anyNumber(),
                children: [childFrame({ completedAt: anyNumber(), result: 1 })],
            }),
        ],
    });

    expect(result).toEqual(runtimeResult({ ticks: 0, done: true }));
    expect(runtime.stack).toEqual(expectedStack);
});
