import { expect, test } from 'vitest';

import { parseScript } from '@agentscript-ai/parser';
import { joinLines } from '@agentscript-ai/utils';

import { createAgent } from '../../agent/createAgent.js';
import { executeAgent } from '../executeAgent.js';
import { completedFrame, rootFrame } from './testUtils.js';

test('while loop, increment variable', async () => {
    const code = joinLines([
        //
        'let a = 1',
        'while (a < 3) {',
        '    ++a;',
        '}',
    ]);

    const script = parseScript(code);
    const agent = createAgent({ script });

    await executeAgent({ agent });

    const expectedStack = rootFrame({
        status: 'done',
        children: [
            // var a declaration
            completedFrame({ node: 'var' }),
            // while statement
            completedFrame({
                node: 'while',
                children: [
                    // first iteration
                    // - condition
                    completedFrame({
                        node: 'binary',
                        value: true,
                        children: [
                            // left operand
                            completedFrame({
                                node: 'ident',
                                value: 1,
                            }),
                        ],
                    }),
                    // - body
                    completedFrame({
                        node: 'block',
                        children: [
                            // assignment
                            completedFrame({
                                node: 'update',
                                value: 2,
                                children: [completedFrame({ node: 'ident', value: 1 })],
                            }),
                        ],
                    }),
                    // second iteration
                    // - condition
                    completedFrame({
                        node: 'binary',
                        value: true,
                        children: [completedFrame({ node: 'ident', value: 2 })],
                    }),
                    // - body
                    completedFrame({
                        node: 'block',
                        children: [
                            // assignment
                            completedFrame({
                                node: 'update',
                                value: 3,
                                children: [completedFrame({ node: 'ident', value: 2 })],
                            }),
                        ],
                    }),
                    // third iteration
                    // - condition
                    completedFrame({
                        node: 'binary',
                        value: false,
                        children: [completedFrame({ node: 'ident', value: 3 })],
                    }),
                ],
            }),
        ],
        variables: {
            a: 3,
        },
    });

    expect(agent.root).toEqual(expectedStack);
    expect(agent.status).toBe('done');
});

test('while loop, break', async () => {
    const code = joinLines([
        //
        'let a = 1',
        'while (true) {',
        '    if (++a > 2) {',
        '        break;',
        '    }',
        '}',
    ]);

    const script = parseScript(code);
    const agent = createAgent({ script });

    await executeAgent({ agent });

    const expectedStack = rootFrame({
        status: 'done',
        variables: {
            a: 3,
        },
        children: [
            // var a declaration
            completedFrame({ node: 'var' }),
            // while statement
            completedFrame({
                node: 'while',
                children: [
                    // first iteration
                    // - condition (liteal)
                    null,
                    // - body
                    completedFrame({
                        node: 'block',
                        children: [
                            completedFrame({
                                node: 'if',
                                children: [
                                    // condition
                                    completedFrame({
                                        node: 'binary',
                                        value: false,
                                        children: [
                                            // left operand
                                            completedFrame({
                                                node: 'update',
                                                value: 2,
                                                children: [
                                                    completedFrame({ node: 'ident', value: 1 }),
                                                ],
                                            }),
                                        ],
                                    }),
                                ],
                            }),
                        ],
                    }),
                    // second iteration
                    // - condition (literal)
                    null,
                    // - body
                    completedFrame({
                        node: 'block',
                        children: [
                            completedFrame({
                                node: 'if',
                                children: [
                                    // condition
                                    completedFrame({
                                        node: 'binary',
                                        value: true,
                                        children: [
                                            // left operand
                                            completedFrame({
                                                node: 'update',
                                                value: 3,
                                                children: [
                                                    completedFrame({ node: 'ident', value: 2 }),
                                                ],
                                            }),
                                        ],
                                    }),
                                    // body
                                    completedFrame({
                                        node: 'block',
                                        children: [completedFrame({ node: 'break' })],
                                    }),
                                ],
                            }),
                        ],
                    }),
                ],
            }),
        ],
    });

    expect(agent.root).toEqual(expectedStack);
    expect(agent.status).toBe('done');
});
