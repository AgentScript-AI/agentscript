import { expect, test } from 'vitest';

import { joinLines } from '@agentscript-ai/utils';

import { createAgent } from '../../agent/createAgent.js';
import { parseScript } from '../../parser/parseScript.js';
import { executeAgent } from '../executeAgent.js';
import { completedFrame, rootFrame } from './testUtils.js';

test('ternary operator with literals, true', async () => {
    const code = joinLines([
        //
        'true ? 1 : 2',
    ]);

    const script = parseScript(code);

    const agent = createAgent({
        tools: {},
        script,
    });

    await executeAgent({ agent });

    const expectedStack = rootFrame({
        status: 'finished',
        children: [
            // ternary operator
            completedFrame({
                trace: '0:0',
                value: 1,
                children: [
                    // condition
                    completedFrame({
                        trace: '0:0:0',
                        value: true,
                    }),
                    // then
                    completedFrame({
                        trace: '0:0:1',
                        value: 1,
                    }),
                ],
            }),
        ],
    });

    expect(agent.root).toEqual(expectedStack);
    expect(agent.status).toBe('finished');
});

test('ternary operator with literals, false', async () => {
    const code = joinLines([
        //
        'false ? 1 : 2',
    ]);

    const script = parseScript(code);

    const agent = createAgent({
        tools: {},
        script,
    });

    await executeAgent({ agent });

    const expectedStack = rootFrame({
        status: 'finished',
        children: [
            // ternary operator
            completedFrame({
                trace: '0:0',
                value: 2,
                children: [
                    // condition
                    completedFrame({
                        trace: '0:0:0',
                        value: false,
                    }),
                    // then
                    completedFrame({
                        trace: '0:0:1',
                        value: 2,
                    }),
                ],
            }),
        ],
    });

    expect(agent.root).toEqual(expectedStack);
    expect(agent.status).toBe('finished');
});

test('ternary operator with literals, undefined', async () => {
    const code = joinLines([
        //
        'undefined ? 1 : 2',
    ]);

    const script = parseScript(code);

    const agent = createAgent({
        tools: {},
        script,
    });

    await executeAgent({ agent });

    const expectedStack = rootFrame({
        status: 'finished',
        children: [
            // ternary operator
            completedFrame({
                trace: '0:0',
                value: 2,
                children: [
                    // condition
                    completedFrame({
                        trace: '0:0:0',
                        value: undefined,
                    }),
                    // then
                    completedFrame({
                        trace: '0:0:1',
                        value: 2,
                    }),
                ],
            }),
        ],
    });

    expect(agent.root).toEqual(expectedStack);
    expect(agent.status).toBe('finished');
});

test('ternary operator with expressions', async () => {
    const code = joinLines([
        //
        'let a = 3',
        'a < 1 ? 1 : 2',
    ]);

    const script = parseScript(code);

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
            // var a declaration
            completedFrame({
                trace: '0:0',
                children: [
                    // literal
                    completedFrame({
                        trace: '0:0:0',
                        value: 3,
                    }),
                ],
            }),
            // ternary operator
            completedFrame({
                trace: '0:1',
                value: 2,
                children: [
                    // condition
                    completedFrame({
                        trace: '0:1:0',
                        value: false,
                        children: [
                            // left operand
                            completedFrame({
                                trace: '0:1:0:0',
                                value: 3,
                            }),
                            // right operand
                            completedFrame({
                                trace: '0:1:0:1',
                                value: 1,
                            }),
                        ],
                    }),
                    // else
                    completedFrame({
                        trace: '0:1:1',
                        value: 2,
                    }),
                ],
            }),
        ],
    });

    expect(agent.root).toEqual(expectedStack);
    expect(agent.status).toBe('finished');
});
