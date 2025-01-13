import { expect, test } from 'vitest';

import { parseScript } from '../../parser/parseScript.js';
import { createAgent } from '../createAgent.js';
import { executeAgent } from '../executeAgent.js';
import { completedFrame, rootFrame } from './testUtils.js';

test('add operator', async () => {
    const script = parseScript([
        //
        'const a = 1 + 2;',
    ]);

    const agent = createAgent({
        tools: {},
        script,
    });

    await executeAgent({ agent });

    const expectedStack = rootFrame({
        status: 'finished',
        variables: {
            a: 3,
        },
        children: [
            // var frame
            completedFrame({
                trace: '0:0',
                children: [
                    // operator frame
                    completedFrame({
                        trace: '0:0:0',
                        value: 3,
                        children: [
                            // left frame
                            completedFrame({
                                trace: '0:0:0:0',
                                value: 1,
                            }),
                            // right frame
                            completedFrame({
                                trace: '0:0:0:1',
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
    const script = parseScript(['const a = 5 - 3;']);

    const agent = createAgent({
        tools: {},
        script,
    });

    await executeAgent({ agent });

    const expectedStack = rootFrame({
        status: 'finished',
        variables: {
            a: 2,
        },
        children: [
            completedFrame({
                trace: '0:0',
                children: [
                    completedFrame({
                        trace: '0:0:0',
                        value: 2,
                        children: [
                            completedFrame({
                                trace: '0:0:0:0',
                                value: 5,
                            }),
                            completedFrame({
                                trace: '0:0:0:1',
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
    const script = parseScript(['const a = 4 * 3;']);

    const agent = createAgent({
        tools: {},
        script,
    });

    await executeAgent({ agent });

    const expectedStack = rootFrame({
        status: 'finished',
        variables: {
            a: 12,
        },
        children: [
            completedFrame({
                trace: '0:0',
                children: [
                    completedFrame({
                        trace: '0:0:0',
                        value: 12,
                        children: [
                            completedFrame({
                                trace: '0:0:0:0',
                                value: 4,
                            }),
                            completedFrame({
                                trace: '0:0:0:1',
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

test('divide operator', async () => {
    const script = parseScript(['const a = 6 / 2;']);

    const agent = createAgent({
        tools: {},
        script,
    });

    await executeAgent({ agent });

    const expectedStack = rootFrame({
        status: 'finished',
        variables: {
            a: 3,
        },
        children: [
            completedFrame({
                trace: '0:0',
                children: [
                    completedFrame({
                        trace: '0:0:0',
                        value: 3,
                        children: [
                            completedFrame({
                                trace: '0:0:0:0',
                                value: 6,
                            }),
                            completedFrame({
                                trace: '0:0:0:1',
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
    const script = parseScript(['const a = 7 % 4;']);

    const agent = createAgent({
        tools: {},
        script,
    });

    await executeAgent({ agent });

    const expectedStack = rootFrame({
        status: 'finished',
        variables: {
            a: 3,
        },
        children: [
            completedFrame({
                trace: '0:0',
                children: [
                    completedFrame({
                        trace: '0:0:0',
                        value: 3,
                        children: [
                            completedFrame({
                                trace: '0:0:0:0',
                                value: 7,
                            }),
                            completedFrame({
                                trace: '0:0:0:1',
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

test('equality operators', async () => {
    const script = parseScript([
        'const a = 1 == 1;',
        'const b = 1 === 1;',
        'const c = 1 != 2;',
        'const d = 1 !== 2;',
    ]);

    const agent = createAgent({
        tools: {},
        script,
    });

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
                trace: '0:0',
                children: [
                    completedFrame({
                        trace: '0:0:0',
                        value: true,
                        children: [
                            completedFrame({
                                trace: '0:0:0:0',
                                value: 1,
                            }),
                            completedFrame({
                                trace: '0:0:0:1',
                                value: 1,
                            }),
                        ],
                    }),
                ],
            }),
            completedFrame({
                trace: '0:1',
                children: [
                    completedFrame({
                        trace: '0:1:0',
                        value: true,
                        children: [
                            completedFrame({
                                trace: '0:1:0:0',
                                value: 1,
                            }),
                            completedFrame({
                                trace: '0:1:0:1',
                                value: 1,
                            }),
                        ],
                    }),
                ],
            }),
            completedFrame({
                trace: '0:2',
                children: [
                    completedFrame({
                        trace: '0:2:0',
                        value: true,
                        children: [
                            completedFrame({
                                trace: '0:2:0:0',
                                value: 1,
                            }),
                            completedFrame({
                                trace: '0:2:0:1',
                                value: 2,
                            }),
                        ],
                    }),
                ],
            }),
            completedFrame({
                trace: '0:3',
                children: [
                    completedFrame({
                        trace: '0:3:0',
                        value: true,
                        children: [
                            completedFrame({
                                trace: '0:3:0:0',
                                value: 1,
                            }),
                            completedFrame({
                                trace: '0:3:0:1',
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

test('comparison operators', async () => {
    const script = parseScript([
        'const a = 2 > 1;',
        'const b = 2 >= 1;',
        'const c = 1 < 2;',
        'const d = 1 <= 2;',
    ]);

    const agent = createAgent({
        tools: {},
        script,
    });

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
                trace: '0:0',
                children: [
                    completedFrame({
                        trace: '0:0:0',
                        value: true,
                        children: [
                            completedFrame({
                                trace: '0:0:0:0',
                                value: 2,
                            }),
                            completedFrame({
                                trace: '0:0:0:1',
                                value: 1,
                            }),
                        ],
                    }),
                ],
            }),
            completedFrame({
                trace: '0:1',
                children: [
                    completedFrame({
                        trace: '0:1:0',
                        value: true,
                        children: [
                            completedFrame({
                                trace: '0:1:0:0',
                                value: 2,
                            }),
                            completedFrame({
                                trace: '0:1:0:1',
                                value: 1,
                            }),
                        ],
                    }),
                ],
            }),
            completedFrame({
                trace: '0:2',
                children: [
                    completedFrame({
                        trace: '0:2:0',
                        value: true,
                        children: [
                            completedFrame({
                                trace: '0:2:0:0',
                                value: 1,
                            }),
                            completedFrame({
                                trace: '0:2:0:1',
                                value: 2,
                            }),
                        ],
                    }),
                ],
            }),
            completedFrame({
                trace: '0:3',
                children: [
                    completedFrame({
                        trace: '0:3:0',
                        value: true,
                        children: [
                            completedFrame({
                                trace: '0:3:0:0',
                                value: 1,
                            }),
                            completedFrame({
                                trace: '0:3:0:1',
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

test('logical operators', async () => {
    const script = parseScript([
        'const a = true && true;',
        'const b = true || false;',
        'const c = null ?? "default";',
    ]);

    const agent = createAgent({
        tools: {},
        script,
    });

    await executeAgent({ agent });

    const expectedStack = rootFrame({
        status: 'finished',
        variables: {
            a: true,
            b: true,
            c: 'default',
        },
        children: [
            completedFrame({
                trace: '0:0',
                children: [
                    completedFrame({
                        trace: '0:0:0',
                        value: true,
                        children: [
                            completedFrame({
                                trace: '0:0:0:0',
                                value: true,
                            }),
                            completedFrame({
                                trace: '0:0:0:1',
                                value: true,
                            }),
                        ],
                    }),
                ],
            }),
            completedFrame({
                trace: '0:1',
                children: [
                    completedFrame({
                        trace: '0:1:0',
                        value: true,
                        children: [
                            completedFrame({
                                trace: '0:1:0:0',
                                value: true,
                            }),
                            completedFrame({
                                trace: '0:1:0:1',
                                value: false,
                            }),
                        ],
                    }),
                ],
            }),
            completedFrame({
                trace: '0:2',
                children: [
                    completedFrame({
                        trace: '0:2:0',
                        value: 'default',
                        children: [
                            completedFrame({
                                trace: '0:2:0:0',
                                value: null,
                            }),
                            completedFrame({
                                trace: '0:2:0:1',
                                value: 'default',
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
