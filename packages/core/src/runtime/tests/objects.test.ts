import { expect, test } from 'vitest';

import { parseScript } from '@agentscript-ai/parser';

import { createAgent } from '../../agent/createAgent.js';
import { executeAgent } from '../executeAgent.js';
import { agentResult, completedFrame, rootFrame } from './testUtils.js';

test('object spread simple', async () => {
    const script = parseScript([
        //
        'const a = { b: 1, c: 2 };',
        'const d = { ...a };',
    ]);

    const agent = createAgent({ script });
    const result = await executeAgent({ agent });

    const expectedStack = rootFrame({
        status: 'done',
        variables: {
            a: { b: 1, c: 2 },
            d: { b: 1, c: 2 },
        },
        children: [
            completedFrame({
                node: 'var',
                children: [
                    completedFrame({
                        node: 'literal',
                        value: { b: 1, c: 2 },
                    }),
                ],
            }),
            completedFrame({
                node: 'var',
                children: [
                    completedFrame({
                        node: 'object',
                        value: { b: 1, c: 2 },
                        children: [
                            completedFrame({
                                node: 'ident',
                                value: { b: 1, c: 2 },
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

test('object spread with properties before', async () => {
    const script = parseScript([
        //
        'const a = { b: 1, c: 2 };',
        'const d = { b: 3, d: 4, ...a };',
    ]);

    const agent = createAgent({ script });
    const result = await executeAgent({ agent });

    const expectedStack = rootFrame({
        status: 'done',
        variables: {
            a: { b: 1, c: 2 },
            d: { b: 1, d: 4, c: 2 },
        },
        children: [
            completedFrame({
                node: 'var',
                children: [
                    completedFrame({
                        node: 'literal',
                        value: { b: 1, c: 2 },
                    }),
                ],
            }),
            completedFrame({
                node: 'var',
                children: [
                    completedFrame({
                        node: 'object',
                        value: { b: 1, d: 4, c: 2 },
                        children: [
                            null,
                            null,
                            completedFrame({
                                node: 'ident',
                                value: { b: 1, c: 2 },
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

test('object spread with properties after', async () => {
    const script = parseScript([
        //
        'const a = { b: 1, c: 2 };',
        'const d = { ...a, c: 3, e: 4 };',
    ]);

    const agent = createAgent({ script });
    const result = await executeAgent({ agent });

    const expectedStack = rootFrame({
        status: 'done',
        variables: {
            a: { b: 1, c: 2 },
            d: { b: 1, c: 3, e: 4 },
        },
        children: [
            completedFrame({
                node: 'var',
                children: [
                    completedFrame({
                        node: 'literal',
                        value: { b: 1, c: 2 },
                    }),
                ],
            }),
            completedFrame({
                node: 'var',
                children: [
                    completedFrame({
                        node: 'object',
                        value: { b: 1, c: 3, e: 4 },
                        children: [
                            completedFrame({
                                node: 'ident',
                                value: { b: 1, c: 2 },
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

test('object spread with properties before and after', async () => {
    const script = parseScript([
        //
        'const a = { b: 1, c: 2, d: 3 };',
        'const e = { b: 4, ...a, d: 5, f: 6 };',
    ]);

    const agent = createAgent({ script });
    const result = await executeAgent({ agent });

    const expectedStack = rootFrame({
        status: 'done',
        variables: {
            a: { b: 1, c: 2, d: 3 },
            e: { b: 1, c: 2, d: 5, f: 6 },
        },
        children: [
            completedFrame({
                node: 'var',
                children: [
                    completedFrame({
                        node: 'literal',
                        value: { b: 1, c: 2, d: 3 },
                    }),
                ],
            }),
            completedFrame({
                node: 'var',
                children: [
                    completedFrame({
                        node: 'object',
                        value: { b: 1, c: 2, d: 5, f: 6 },
                        children: [
                            null,
                            completedFrame({
                                node: 'ident',
                                value: { b: 1, c: 2, d: 3 },
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

test('object spread nested', async () => {
    const script = parseScript([
        //
        'const a = { b: 1, c: 2 };',
        'const d = { ...a, e: { ...a } };',
    ]);

    const agent = createAgent({ script });
    const result = await executeAgent({ agent });

    const expectedStack = rootFrame({
        status: 'done',
        variables: {
            a: { b: 1, c: 2 },
            d: { b: 1, c: 2, e: { b: 1, c: 2 } },
        },
        children: [
            completedFrame({
                node: 'var',
                children: [
                    completedFrame({
                        node: 'literal',
                        value: { b: 1, c: 2 },
                    }),
                ],
            }),
            completedFrame({
                node: 'var',
                children: [
                    completedFrame({
                        node: 'object',
                        value: { b: 1, c: 2, e: { b: 1, c: 2 } },
                        children: [
                            completedFrame({
                                node: 'ident',
                                value: { b: 1, c: 2 },
                            }),
                            completedFrame({
                                node: 'object',
                                value: { b: 1, c: 2 },
                                children: [
                                    completedFrame({
                                        node: 'ident',
                                        value: { b: 1, c: 2 },
                                    }),
                                ],
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

test('assign object property', async () => {
    const script = parseScript([
        //
        'const a = { b: 1, c: 2 };',
        'a.b = 3;',
    ]);

    const agent = createAgent({ script });
    const result = await executeAgent({ agent });

    const expectedStack = rootFrame({
        status: 'done',
        variables: {
            a: { b: 3, c: 2 },
        },
        children: [
            completedFrame({
                node: 'var',
                children: [
                    completedFrame({
                        node: 'literal',
                        value: { b: 3, c: 2 },
                    }),
                ],
            }),
            completedFrame({
                node: 'assign',
                value: 3,
                children: [
                    // value
                    null,
                    // obj
                    completedFrame({
                        node: 'ident',
                        value: { b: 3, c: 2 },
                    }),
                ],
            }),
        ],
    });

    expect(result).toEqual(agentResult({ ticks: 0 }));
    expect(agent.root).toEqual(expectedStack);
    expect(agent.status).toBe('done');
});

test('assign object property nested', async () => {
    const script = parseScript([
        //
        'const a = { b: { c: 1 } };',
        'a.b.c = 2;',
    ]);

    const agent = createAgent({ script });
    const result = await executeAgent({ agent });

    const expectedStack = rootFrame({
        status: 'done',
        variables: { a: { b: { c: 2 } } },
        children: [
            completedFrame({
                node: 'var',
                children: [
                    completedFrame({
                        node: 'literal',
                        value: { b: { c: 2 } },
                    }),
                ],
            }),
            completedFrame({
                node: 'assign',
                value: 2,
                children: [
                    // value
                    null,
                    // obj
                    completedFrame({
                        node: 'member',
                        value: { c: 2 },
                        children: [
                            completedFrame({
                                node: 'ident',
                                value: { b: { c: 2 } },
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

test('assign object property dynamic', async () => {
    const script = parseScript([
        //
        'const a = { b: 1, c: 2 };',
        'const d = "b";',
        'a[d] = a.c;',
    ]);

    const agent = createAgent({ script });
    const result = await executeAgent({ agent });

    const expectedStack = rootFrame({
        status: 'done',
        variables: { a: { b: 2, c: 2 }, d: 'b' },
        children: [
            // a var
            completedFrame({
                node: 'var',
                children: [
                    completedFrame({
                        node: 'literal',
                        value: { b: 2, c: 2 },
                    }),
                ],
            }),
            // d var
            completedFrame({
                node: 'var',
            }),
            // assign
            completedFrame({
                node: 'assign',
                value: 2,
                children: [
                    // value
                    completedFrame({
                        node: 'member',
                        value: 2,
                        children: [
                            completedFrame({
                                node: 'ident',
                                value: { b: 2, c: 2 },
                            }),
                        ],
                    }),
                    // obj
                    completedFrame({
                        node: 'ident',
                        value: { b: 2, c: 2 },
                    }),
                    // key
                    completedFrame({
                        node: 'ident',
                        value: 'b',
                    }),
                ],
            }),
        ],
    });

    expect(result).toEqual(agentResult({ ticks: 0 }));
    expect(agent.root).toEqual(expectedStack);
    expect(agent.status).toBe('done');
});

test('assign value to unsafe object', async () => {
    const script = parseScript([
        //
        'Date.foo = 1;',
    ]);
    const agent = createAgent({ script });

    await expect(executeAgent({ agent })).rejects.toThrow(
        'Assigning to unsafe value is not allowed',
    );
});
