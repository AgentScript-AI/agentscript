import { expect, test } from 'vitest';

import { createAgent } from '../../agent/createAgent.js';
import { parseScript } from '../../parser/parseScript.js';
import { executeAgent } from '../executeAgent.js';
import { agentResult, completedFrame, rootFrame } from './testUtils.js';

test('single variable declaration', async () => {
    const script = parseScript([
        //
        'const a = 1;',
    ]);

    const agent = createAgent({
        tools: {},
        script,
    });

    let result = await executeAgent({ agent });

    expect(result).toEqual(agentResult({ ticks: 0 }));

    const expectedStack = rootFrame({
        status: 'finished',
        variables: {
            a: 1,
        },
        children: [
            completedFrame({
                trace: '0:0',
                children: [
                    completedFrame({
                        trace: '0:0:0',
                        value: 1,
                    }),
                ],
            }),
        ],
    });

    expect(agent.root).toEqual(expectedStack);
    expect(agent.status).toBe('finished');

    result = await executeAgent({ agent });

    expect(result).toEqual(agentResult({ ticks: 0 }));
    expect(agent.root).toEqual(expectedStack);
    expect(agent.status).toBe('finished');
});

test('multiple variable declarations', async () => {
    const script = parseScript([
        //
        'const a = 1;',
        'const b = 2;',
    ]);

    const agent = createAgent({
        tools: {},
        script,
    });

    let result = await executeAgent({ agent });

    expect(result).toEqual(agentResult({ ticks: 0 }));

    const expectedStack = rootFrame({
        status: 'finished',
        variables: {
            a: 1,
            b: 2,
        },
        children: [
            //
            completedFrame({
                trace: '0:0',
                children: [
                    completedFrame({
                        trace: '0:0:0',
                        value: 1,
                    }),
                ],
            }),
            completedFrame({
                trace: '0:1',
                children: [
                    completedFrame({
                        trace: '0:1:0',
                        value: 2,
                    }),
                ],
            }),
        ],
    });

    expect(agent.root).toEqual(expectedStack);
    expect(agent.status).toBe('finished');

    result = await executeAgent({ agent });
    expect(result).toEqual(agentResult({ ticks: 0 }));
    expect(agent.root).toEqual(expectedStack);
    expect(agent.status).toBe('finished');
});

test('assign variable', async () => {
    const script = parseScript(['let a = 1', 'a = 2;']);
    const agent = createAgent({
        tools: {},
        script,
    });

    const result = await executeAgent({ agent });

    const expectedStack = rootFrame({
        status: 'finished',
        variables: { a: 2 },
        children: [
            completedFrame({
                trace: '0:0',
                children: [completedFrame({ trace: '0:0:0', value: 1 })],
            }),
            completedFrame({
                trace: '0:1',
                children: [completedFrame({ trace: '0:1:0', value: 2 })],
            }),
        ],
    });

    expect(result).toEqual(agentResult({ ticks: 0 }));
    expect(agent.root).toEqual(expectedStack);
    expect(agent.status).toBe('finished');
});

test('member expression', async () => {
    const script = parseScript([
        //
        'const a = { b: 1 };',
        'const c = a.b;',
    ]);

    const agent = createAgent({
        tools: {},
        script,
    });

    const result = await executeAgent({ agent });

    const expectedStack = rootFrame({
        status: 'finished',
        variables: { a: { b: 1 }, c: 1 },
        children: [
            completedFrame({
                trace: '0:0',
                children: [
                    completedFrame({
                        trace: '0:0:0',
                        value: { b: 1 },
                    }),
                ],
            }),
            completedFrame({
                trace: '0:1',
                children: [
                    completedFrame({
                        trace: '0:1:0',
                        value: 1,
                        children: [
                            completedFrame({
                                trace: '0:1:0:0',
                                value: { b: 1 },
                            }),
                        ],
                    }),
                ],
            }),
        ],
    });

    expect(result).toEqual(agentResult({ ticks: 0 }));
    expect(agent.root).toEqual(expectedStack);
    expect(agent.status).toBe('finished');
});

test('array.length', async () => {
    const script = parseScript([
        //
        'const a = [1, 2, 3];',
        'a.length;',
    ]);

    const agent = createAgent({
        tools: {},
        script,
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
                        value: [1, 2, 3],
                    }),
                ],
            }),
            completedFrame({
                trace: '0:1',
                value: 3,
                children: [completedFrame({ trace: '0:1:0', value: [1, 2, 3] })],
            }),
        ],
        variables: { a: [1, 2, 3] },
    });

    expect(result).toEqual(agentResult({ ticks: 0 }));
    expect(agent.root).toEqual(expectedStack);
    expect(agent.status).toBe('finished');
});
