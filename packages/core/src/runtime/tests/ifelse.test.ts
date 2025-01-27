import { expect, test } from 'vitest';

import { parseScript } from '@agentscript-ai/parser';
import { joinLines } from '@agentscript-ai/utils';

import { createAgent } from '../../agent/createAgent.js';
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
    const agent = createAgent({ script });

    await executeAgent({ agent });

    const expectedStack = rootFrame({
        status: 'finished',
        children: [
            // var a declaration
            completedFrame({ node: 'var' }),
            // if statement
            completedFrame({
                node: 'if',
                children: [
                    // condition
                    completedFrame({
                        node: 'operator',
                        value: true,
                        children: [
                            // left operand
                            completedFrame({
                                node: 'ident',
                                value: 1,
                            }),
                        ],
                    }),
                    // body
                    completedFrame({
                        node: 'block',
                        children: [
                            // assignment
                            completedFrame({
                                node: 'assign',
                                value: 2,
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

    const agent = createAgent({ script });

    await executeAgent({ agent });

    const expectedStack = rootFrame({
        status: 'finished',
        children: [
            // var a declaration
            completedFrame({ node: 'var' }),
            // if statement
            completedFrame({
                node: 'if',
                children: [
                    // condition
                    completedFrame({
                        node: 'operator',
                        value: false,
                        children: [
                            // left operand
                            completedFrame({
                                node: 'ident',
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
        'if (1 < a) {',
        '    a = 2',
        '} else {',
        '    a = 3',
        '}',
    ]);

    const script = parseScript(code);
    const agent = createAgent({ script });

    await executeAgent({ agent });

    const expectedStack = rootFrame({
        status: 'finished',
        children: [
            // var a declaration
            completedFrame({ node: 'var' }),
            // if statement
            completedFrame({
                node: 'if',
                children: [
                    // condition
                    completedFrame({
                        node: 'operator',
                        value: false,
                        children: [
                            // left operand (litaral)
                            null,
                            // right operand
                            completedFrame({
                                node: 'ident',
                                value: 1,
                            }),
                        ],
                    }),
                    // else body
                    completedFrame({
                        node: 'block',
                        children: [
                            // assignment
                            completedFrame({
                                node: 'assign',
                                value: 3,
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

    const agent = createAgent({ script });

    await executeAgent({ agent });

    const expectedStack = rootFrame({
        status: 'finished',
        children: [
            // var a declaration
            completedFrame({ node: 'var' }),
            // if statement
            completedFrame({
                node: 'if',
                children: [
                    // condition
                    completedFrame({
                        node: 'operator',
                        value: false,
                        children: [
                            // left operand
                            completedFrame({
                                node: 'ident',
                                value: 1,
                            }),
                        ],
                    }),
                    // else if body
                    completedFrame({
                        node: 'if',
                        children: [
                            // condition
                            completedFrame({
                                node: 'operator',
                                value: true,
                                children: [
                                    // left operand
                                    completedFrame({
                                        node: 'ident',
                                        value: 1,
                                    }),
                                ],
                            }),
                            // else if body
                            completedFrame({
                                node: 'block',
                                children: [
                                    // assignment
                                    completedFrame({
                                        node: 'assign',
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
