import { expect, test } from 'vitest';

import { parseScript } from '@agentscript-ai/parser';
import * as s from '@agentscript-ai/schema';
import { joinLines } from '@agentscript-ai/utils';

import { createAgent } from '../../agent/createAgent.js';
import { executeAgent } from '../executeAgent.js';
import { completedFrame, rootFrame } from './testUtils.js';
import { defineTool } from '../../tools/defineTool.js';

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
        status: 'done',
        children: [
            // ternary operator
            completedFrame({
                node: 'ternary',
                value: 1,
            }),
        ],
    });

    expect(agent.root).toEqual(expectedStack);
    expect(agent.status).toBe('done');
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
        status: 'done',
        children: [
            // ternary operator
            completedFrame({
                node: 'ternary',
                value: 2,
            }),
        ],
    });

    expect(agent.root).toEqual(expectedStack);
    expect(agent.status).toBe('done');
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
        status: 'done',
        children: [
            // ternary operator
            completedFrame({
                node: 'ternary',
                value: 2,
            }),
        ],
    });

    expect(agent.root).toEqual(expectedStack);
    expect(agent.status).toBe('done');
});

test('ternary operator with expressions', async () => {
    const code = joinLines([
        //
        'let a = 3',
        'a < 1 ? 1 : a + 1',
    ]);

    const script = parseScript(code);

    const agent = createAgent({
        tools: {},
        script,
    });

    await executeAgent({ agent });

    const expectedStack = rootFrame({
        status: 'done',
        variables: {
            a: 3,
        },
        children: [
            // var a declaration
            completedFrame({ node: 'var' }),
            // ternary operator
            completedFrame({
                node: 'ternary',
                value: 4,
                children: [
                    // condition
                    completedFrame({
                        node: 'binary',
                        value: false,
                        children: [
                            // left operand
                            completedFrame({
                                node: 'ident',
                                value: 3,
                            }),
                        ],
                    }),
                    // else
                    completedFrame({
                        node: 'binary',
                        value: 4,
                        children: [
                            // left operand
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
    expect(agent.status).toBe('done');
});

test('ternary operator with async tool', async () => {
    const tool = defineTool({
        description: 'foo',
        output: s.string(),
        handler: () => {
            return Promise.resolve('bar');
        },
    });

    const code = joinLines([
        //
        'foo() === "bar" ? "foo" + foo() : "foo"',
    ]);

    const script = parseScript(code);

    const agent = createAgent({
        tools: { foo: tool },
        script,
    });

    await executeAgent({ agent });

    const expectedStack = rootFrame({
        status: 'done',
        children: [
            // ternary operator
            completedFrame({
                node: 'ternary',
                value: 'foobar',
                children: [
                    // condition
                    completedFrame({
                        node: 'binary',
                        value: true,
                        children: [
                            // left operand
                            completedFrame({
                                node: 'call',
                                value: 'bar',
                            }),
                        ],
                    }),
                    // then
                    completedFrame({
                        node: 'binary',
                        value: 'foobar',
                        children: [
                            // left operand
                            null,
                            // right operand
                            completedFrame({
                                node: 'call',
                                value: 'bar',
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
