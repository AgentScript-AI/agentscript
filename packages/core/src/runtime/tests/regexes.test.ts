import { expect, test } from 'vitest';

import { parseScript } from '@agentscript-ai/parser';
import { joinLines } from '@agentscript-ai/utils';

import { createAgent } from '../../agent/createAgent.js';
import { executeAgent } from '../executeAgent.js';
import { completedFrame, rootFrame } from './testUtils.js';

test('regex expression', async () => {
    const code = joinLines([
        //
        'const a = /test/',
        'const b = a.test("test")',
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
            // var a declaration
            completedFrame({
                node: 'var',
                children: [
                    // regex expression
                    completedFrame({ node: 'regex', value: /test/ }),
                ],
            }),
            // var b declaration
            completedFrame({
                node: 'var',
                children: [
                    // test method
                    completedFrame({
                        node: 'call',
                        value: true,
                        children: [
                            // this arg
                            completedFrame({ node: 'ident', value: /test/ }),
                        ],
                    }),
                ],
            }),
        ],
        variables: {
            a: /test/,
            b: true,
        },
    });

    expect(agent.root).toEqual(expectedStack);
    expect(agent.status).toBe('done');
});

test('regex expression with flags', async () => {
    const code = joinLines([
        //
        'const a = /test/i',
        'const b = a.test("TEST")',
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
            // var a declaration
            completedFrame({
                node: 'var',
                children: [
                    // regex expression
                    completedFrame({ node: 'regex', value: /test/i }),
                ],
            }),
            // var b declaration
            completedFrame({
                node: 'var',
                children: [
                    // test method
                    completedFrame({
                        node: 'call',
                        value: true,
                        children: [
                            // this arg
                            completedFrame({ node: 'ident', value: /test/i }),
                        ],
                    }),
                ],
            }),
        ],
        variables: {
            a: /test/i,
            b: true,
        },
    });

    expect(agent.root).toEqual(expectedStack);
    expect(agent.status).toBe('done');
});

test('new regex expression', async () => {
    const code = joinLines([
        //
        'const a = new RegExp("test", "i")',
        'const b = a.test("TEST")',
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
            // var a declaration
            completedFrame({
                node: 'var',
                children: [
                    // new expression
                    completedFrame({
                        node: 'new',
                        value: /test/i,
                    }),
                ],
            }),
            // var b declaration
            completedFrame({
                node: 'var',
                children: [
                    // test method
                    completedFrame({
                        node: 'call',
                        value: true,
                        children: [
                            // this arg
                            completedFrame({ node: 'ident', value: /test/i }),
                        ],
                    }),
                ],
            }),
        ],
        variables: {
            a: /test/i,
            b: true,
        },
    });

    expect(agent.root).toEqual(expectedStack);
    expect(agent.status).toBe('done');
});
