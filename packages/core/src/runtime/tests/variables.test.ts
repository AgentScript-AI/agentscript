import { expect, test } from 'vitest';

import { parseScript } from '@agentscript-ai/parser';

import { createAgent } from '../../agent/createAgent.js';
import { executeAgent } from '../executeAgent.js';
import { agentResult, completedFrame, rootFrame } from './testUtils.js';

test('single variable declaration', async () => {
    const script = parseScript([
        //
        'const a = 1;',
    ]);

    const agent = createAgent({ script });
    let result = await executeAgent({ agent });

    expect(result).toEqual(agentResult({ ticks: 0 }));

    const expectedStack = rootFrame({
        status: 'done',
        variables: {
            a: 1,
        },
        children: [completedFrame({ node: 'var' })],
    });

    expect(agent.root).toEqual(expectedStack);
    expect(agent.status).toBe('done');

    result = await executeAgent({ agent });

    expect(result).toEqual(agentResult({ ticks: 0 }));
    expect(agent.root).toEqual(expectedStack);
    expect(agent.status).toBe('done');
});

test('multiple variable declarations', async () => {
    const script = parseScript([
        //
        'const a = 1;',
        'const b = 2;',
    ]);

    const agent = createAgent({ script });
    let result = await executeAgent({ agent });

    expect(result).toEqual(agentResult({ ticks: 0 }));

    const expectedStack = rootFrame({
        status: 'done',
        variables: {
            a: 1,
            b: 2,
        },
        children: [
            //
            completedFrame({ node: 'var' }),
            completedFrame({ node: 'var' }),
        ],
    });

    expect(agent.root).toEqual(expectedStack);
    expect(agent.status).toBe('done');

    result = await executeAgent({ agent });
    expect(result).toEqual(agentResult({ ticks: 0 }));
    expect(agent.root).toEqual(expectedStack);
    expect(agent.status).toBe('done');
});

test('assign literal to variable', async () => {
    const script = parseScript(['let a = 1', 'a = 2;']);
    const agent = createAgent({ script });

    const result = await executeAgent({ agent });

    const expectedStack = rootFrame({
        status: 'done',
        variables: { a: 2 },
        children: [
            completedFrame({ node: 'var' }),
            completedFrame({
                node: 'assign',
                value: 2,
            }),
        ],
    });

    expect(result).toEqual(agentResult({ ticks: 0 }));
    expect(agent.root).toEqual(expectedStack);
    expect(agent.status).toBe('done');
});

test('assign expression to variable', async () => {
    const script = parseScript(['let a = 1', 'a = a + 1;']);
    const agent = createAgent({ script });

    const result = await executeAgent({ agent });

    const expectedStack = rootFrame({
        status: 'done',
        variables: { a: 2 },
        children: [
            completedFrame({ node: 'var' }),
            completedFrame({
                node: 'assign',
                value: 2,
                children: [
                    // left side
                    null,
                    // right side
                    completedFrame({
                        node: 'binary',
                        value: 2,
                        children: [
                            // left side
                            completedFrame({
                                node: 'ident',
                                value: 1,
                            }),
                        ],
                    }),
                ],
            }),
        ],
    });

    expect(result).toEqual(agentResult({ ticks: 0 }));
    expect(agent.root).toEqual(expectedStack);
    expect(agent.status).toBe('done');
});

test('member expression', async () => {
    const script = parseScript([
        //
        'const a = { b: 1 };',
        'const c = a.b;',
    ]);

    const agent = createAgent({ script });
    const result = await executeAgent({ agent });

    const expectedStack = rootFrame({
        status: 'done',
        variables: { a: { b: 1 }, c: 1 },
        children: [
            completedFrame({ node: 'var' }),
            completedFrame({
                node: 'var',
                children: [
                    completedFrame({
                        node: 'member',
                        value: 1,
                        children: [
                            completedFrame({
                                node: 'ident',
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
    expect(agent.status).toBe('done');
});

test('array.length', async () => {
    const script = parseScript([
        //
        'const a = [1, 2, 3];',
        'const b = a.length;',
    ]);

    const agent = createAgent({ script });
    const result = await executeAgent({ agent });

    const expectedStack = rootFrame({
        status: 'done',
        children: [
            completedFrame({ node: 'var' }),
            completedFrame({
                node: 'var',
                children: [
                    completedFrame({
                        node: 'member',
                        value: 3,
                        children: [
                            completedFrame({
                                node: 'ident',
                                value: [1, 2, 3],
                            }),
                        ],
                    }),
                ],
            }),
        ],
        variables: {
            a: [1, 2, 3],
            b: 3,
        },
    });

    expect(result).toEqual(agentResult({ ticks: 0 }));
    expect(agent.root).toEqual(expectedStack);
    expect(agent.status).toBe('done');
});
