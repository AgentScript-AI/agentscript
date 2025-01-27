import { expect, test } from 'vitest';

import { parseScript } from '@agentscript-ai/parser';

import { createAgent } from '../../agent/createAgent.js';
import { executeAgent } from '../executeAgent.js';
import { completedFrame, rootFrame } from './testUtils.js';

test('add operator', async () => {
    const script = parseScript([
        //
        'const a = 2;',
        'const b = 1 + a;',
    ]);

    const agent = createAgent({ script });

    await executeAgent({ agent });

    const expectedStack = rootFrame({
        status: 'finished',
        variables: {
            a: 2,
            b: 3,
        },
        children: [
            // var a declaration
            completedFrame({ node: 'var' }),
            // var b declaration
            completedFrame({
                node: 'var',
                children: [
                    // operator frame
                    completedFrame({
                        node: 'operator',
                        value: 3,
                        children: [
                            // left operand literal
                            null,
                            // right operand
                            completedFrame({
                                node: 'ident',
                                value: 2,
                            }),
                        ],
                    }),
                ],
            }),
        ],
    });

    expect(agent.root).toEqual(expectedStack);
    expect(agent.status).toBe('finished');
});

test('subtract operator', async () => {
    const script = parseScript([
        //
        'const a = 3;',
        'const b = 5 - a;',
    ]);

    const agent = createAgent({ script });

    await executeAgent({ agent });

    const expectedStack = rootFrame({
        status: 'finished',
        variables: {
            a: 3,
            b: 2,
        },
        children: [
            // var a declaration
            completedFrame({ node: 'var' }),
            // var b declaration
            completedFrame({
                node: 'var',
                children: [
                    // operator frame
                    completedFrame({
                        node: 'operator',
                        value: 2,
                        children: [
                            // left operand
                            null,
                            // right operand
                            completedFrame({
                                node: 'ident',
                                value: 3,
                            }),
                        ],
                    }),
                ],
            }),
        ],
    });

    expect(agent.root).toEqual(expectedStack);
    expect(agent.status).toBe('finished');
});

test('multiply operator', async () => {
    const script = parseScript([
        //
        'const a = 4;',
        'const b = 3 * a;',
    ]);

    const agent = createAgent({ script });

    await executeAgent({ agent });

    const expectedStack = rootFrame({
        status: 'finished',
        variables: {
            a: 4,
            b: 12,
        },
        children: [
            // var a declaration
            completedFrame({ node: 'var' }),
            // var b declaration
            completedFrame({
                node: 'var',
                children: [
                    // operator frame
                    completedFrame({
                        node: 'operator',
                        value: 12,
                        children: [
                            // left operand
                            null,
                            // right operand
                            completedFrame({
                                node: 'ident',
                                value: 4,
                            }),
                        ],
                    }),
                ],
            }),
        ],
    });

    expect(agent.root).toEqual(expectedStack);
    expect(agent.status).toBe('finished');
});

test('divide operator', async () => {
    const script = parseScript([
        //
        'const a = 2;',
        'const b = 6 / a;',
    ]);

    const agent = createAgent({ script });

    await executeAgent({ agent });

    const expectedStack = rootFrame({
        status: 'finished',
        variables: {
            a: 2,
            b: 3,
        },
        children: [
            // var a declaration
            completedFrame({ node: 'var' }),
            // var b declaration
            completedFrame({
                node: 'var',
                children: [
                    // operator frame
                    completedFrame({
                        node: 'operator',
                        value: 3,
                        children: [
                            // left operand
                            null,
                            // right operand
                            completedFrame({
                                node: 'ident',
                                value: 2,
                            }),
                        ],
                    }),
                ],
            }),
        ],
    });

    expect(agent.root).toEqual(expectedStack);
    expect(agent.status).toBe('finished');
});

test('modulo operator', async () => {
    const script = parseScript([
        //
        'const a = 3;',
        'const b = 7 % a;',
    ]);

    const agent = createAgent({ script });

    await executeAgent({ agent });

    const expectedStack = rootFrame({
        status: 'finished',
        variables: {
            a: 3,
            b: 1,
        },
        children: [
            // var a declaration
            completedFrame({ node: 'var' }),
            // var b declaration
            completedFrame({
                node: 'var',
                children: [
                    // operator frame
                    completedFrame({
                        node: 'operator',
                        value: 1,
                        children: [
                            // left operand
                            null,
                            // right operand
                            completedFrame({
                                node: 'ident',
                                value: 3,
                            }),
                        ],
                    }),
                ],
            }),
        ],
    });

    expect(agent.root).toEqual(expectedStack);
    expect(agent.status).toBe('finished');
});

test('equality operators', async () => {
    const script = parseScript([
        'const a = 1 == 1;',
        'const b = 1 === 1;',
        'const c = 1 != 2;',
        'const d = 1 !== 2;',
    ]);

    const agent = createAgent({ script });

    await executeAgent({ agent });

    const expectedStack = rootFrame({
        status: 'finished',
        variables: {
            a: true,
            b: true,
            c: true,
            d: true,
        },
        children: [
            completedFrame({
                node: 'var',
                children: [
                    completedFrame({
                        node: 'operator',
                        value: true,
                    }),
                ],
            }),
            completedFrame({
                node: 'var',
                children: [
                    completedFrame({
                        node: 'operator',
                        value: true,
                    }),
                ],
            }),
            completedFrame({
                node: 'var',
                children: [
                    completedFrame({
                        node: 'operator',
                        value: true,
                    }),
                ],
            }),
            completedFrame({
                node: 'var',
                children: [
                    completedFrame({
                        node: 'operator',
                        value: true,
                    }),
                ],
            }),
        ],
    });

    expect(agent.root).toEqual(expectedStack);
    expect(agent.status).toBe('finished');
});

test('comparison operators', async () => {
    const script = parseScript([
        'const a = 2 > 1;',
        'const b = 2 >= 1;',
        'const c = 1 < 2;',
        'const d = 1 <= 2;',
    ]);

    const agent = createAgent({ script });

    await executeAgent({ agent });

    const expectedStack = rootFrame({
        status: 'finished',
        variables: {
            a: true,
            b: true,
            c: true,
            d: true,
        },
        children: [
            completedFrame({
                node: 'var',
                children: [
                    completedFrame({
                        node: 'operator',
                        value: true,
                    }),
                ],
            }),
            completedFrame({
                node: 'var',
                children: [
                    completedFrame({
                        node: 'operator',
                        value: true,
                    }),
                ],
            }),
            completedFrame({
                node: 'var',
                children: [
                    completedFrame({
                        node: 'operator',
                        value: true,
                    }),
                ],
            }),
            completedFrame({
                node: 'var',
                children: [
                    completedFrame({
                        node: 'operator',
                        value: true,
                    }),
                ],
            }),
        ],
    });

    expect(agent.root).toEqual(expectedStack);
    expect(agent.status).toBe('finished');
});

test('logical operators', async () => {
    const script = parseScript([
        'const a = true && true;',
        'const b = true || false;',
        'const c = null ?? "default";',
        'const d = undefined ?? "default";',
    ]);

    const agent = createAgent({ script });

    await executeAgent({ agent });

    const expectedStack = rootFrame({
        status: 'finished',
        variables: {
            a: true,
            b: true,
            c: 'default',
            d: 'default',
        },
        children: [
            completedFrame({
                node: 'var',
                children: [
                    completedFrame({
                        node: 'operator',
                        value: true,
                    }),
                ],
            }),
            completedFrame({
                node: 'var',
                children: [
                    completedFrame({
                        node: 'operator',
                        value: true,
                    }),
                ],
            }),
            completedFrame({
                node: 'var',
                children: [
                    completedFrame({
                        node: 'operator',
                        value: 'default',
                    }),
                ],
            }),
            completedFrame({
                node: 'var',
                children: [
                    completedFrame({
                        node: 'operator',
                        value: 'default',
                    }),
                ],
            }),
        ],
    });

    expect(agent.root).toEqual(expectedStack);
    expect(agent.status).toBe('finished');
});
