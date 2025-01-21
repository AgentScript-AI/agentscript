import { expect, test } from 'vitest';

import { joinLines } from '@agentscript-ai/utils';

import { createAgent } from '../../agent/createAgent.js';
import { parseScript } from '../../parser/parseScript.js';
import { executeAgent } from '../executeAgent.js';
import { completedFrame, rootFrame } from './testUtils.js';

test('if statement, passed', async () => {
    const code = joinLines([
        //
        'let a = 1',
        'if (a > 0) {',
        '    a = 2',
        '}',
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
            // var a declaration
            completedFrame({
                trace: '0:0',
                children: [
                    // literal
                    completedFrame({
                        trace: '0:0:0',
                        value: 1,
                    }),
                ],
            }),
            // if statement
            completedFrame({
                trace: '0:1',
                children: [
                    // condition
                    completedFrame({
                        trace: '0:1:0',
                        value: true,
                        children: [
                            // left operand
                            completedFrame({
                                trace: '0:1:0:0',
                                value: 1,
                            }),
                            // right operand
                            completedFrame({
                                trace: '0:1:0:1',
                                value: 0,
                            }),
                        ],
                    }),
                    // body
                    completedFrame({
                        trace: '0:1:1',
                        children: [
                            // assignment
                            completedFrame({
                                trace: '0:1:1:0',
                                value: 2,
                                children: [
                                    // literal
                                    completedFrame({
                                        trace: '0:1:1:0:0',
                                        value: 2,
                                    }),
                                ],
                            }),
                        ],
                    }),
                ],
            }),
        ],
        variables: {
            a: 2,
        },
    });

    expect(agent.root).toEqual(expectedStack);
    expect(agent.status).toBe('finished');
});

test('if statement, failed', async () => {
    const code = joinLines([
        //
        'let a = 1',
        'if (a > 1) {',
        '    a = 2',
        '}',
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
            // var a declaration
            completedFrame({
                trace: '0:0',
                children: [
                    // literal
                    completedFrame({
                        trace: '0:0:0',
                        value: 1,
                    }),
                ],
            }),
            // if statement
            completedFrame({
                trace: '0:1',
                children: [
                    // condition
                    completedFrame({
                        trace: '0:1:0',
                        value: false,
                        children: [
                            // left operand
                            completedFrame({
                                trace: '0:1:0:0',
                                value: 1,
                            }),
                            // right operand
                            completedFrame({
                                trace: '0:1:0:1',
                                value: 1,
                            }),
                        ],
                    }),
                ],
            }),
        ],
        variables: {
            a: 1,
        },
    });

    expect(agent.root).toEqual(expectedStack);
    expect(agent.status).toBe('finished');
});

test('if statement, else', async () => {
    const code = joinLines([
        //
        'let a = 1',
        'if (a > 1) {',
        '    a = 2',
        '} else {',
        '    a = 3',
        '}',
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
            // var a declaration
            completedFrame({
                trace: '0:0',
                children: [
                    // literal
                    completedFrame({
                        trace: '0:0:0',
                        value: 1,
                    }),
                ],
            }),
            // if statement
            completedFrame({
                trace: '0:1',
                children: [
                    // condition
                    completedFrame({
                        trace: '0:1:0',
                        value: false,
                        children: [
                            // left operand
                            completedFrame({
                                trace: '0:1:0:0',
                                value: 1,
                            }),
                            // right operand
                            completedFrame({
                                trace: '0:1:0:1',
                                value: 1,
                            }),
                        ],
                    }),
                    // else body
                    completedFrame({
                        trace: '0:1:1',
                        children: [
                            // assignment
                            completedFrame({
                                trace: '0:1:1:0',
                                value: 3,
                                children: [
                                    // literal
                                    completedFrame({
                                        trace: '0:1:1:0:0',
                                        value: 3,
                                    }),
                                ],
                            }),
                        ],
                    }),
                ],
            }),
        ],
        variables: {
            a: 3,
        },
    });

    expect(agent.root).toEqual(expectedStack);
    expect(agent.status).toBe('finished');
});

test('if statement, else if', async () => {
    const code = joinLines([
        //
        'let a = 1',
        'if (a > 1) {',
        '    a = 2',
        '} else if (a > 0) {',
        '    a = 3',
        '}',
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
            // var a declaration
            completedFrame({
                trace: '0:0',
                children: [
                    // literal
                    completedFrame({
                        trace: '0:0:0',
                        value: 1,
                    }),
                ],
            }),
            // if statement
            completedFrame({
                trace: '0:1',
                children: [
                    // condition
                    completedFrame({
                        trace: '0:1:0',
                        value: false,
                        children: [
                            // left operand
                            completedFrame({
                                trace: '0:1:0:0',
                                value: 1,
                            }),
                            // right operand
                            completedFrame({
                                trace: '0:1:0:1',
                                value: 1,
                            }),
                        ],
                    }),
                    // else if body
                    completedFrame({
                        trace: '0:1:1',
                        children: [
                            // condition
                            completedFrame({
                                trace: '0:1:1:0',
                                value: true,
                                children: [
                                    // left operand
                                    completedFrame({
                                        trace: '0:1:1:0:0',
                                        value: 1,
                                    }),
                                    // right operand
                                    completedFrame({
                                        trace: '0:1:1:0:1',
                                        value: 0,
                                    }),
                                ],
                            }),
                            // else if body
                            completedFrame({
                                trace: '0:1:1:1',
                                children: [
                                    // assignment
                                    completedFrame({
                                        trace: '0:1:1:1:0',
                                        value: 3,
                                        children: [
                                            // literal
                                            completedFrame({
                                                trace: '0:1:1:1:0:0',
                                                value: 3,
                                            }),
                                        ],
                                    }),
                                ],
                            }),
                        ],
                    }),
                ],
            }),
        ],
        variables: {
            a: 3,
        },
    });

    expect(agent.root).toEqual(expectedStack);
    expect(agent.status).toBe('finished');
});
