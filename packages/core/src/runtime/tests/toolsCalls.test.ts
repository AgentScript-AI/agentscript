import { describe, expect, test } from 'vitest';

import * as s from '@agentscript-ai/schema';

import { createAgent } from '../../agent/createAgent.js';
import { parseScript } from '../../parser/parseScript.js';
import { defineTool } from '../../tools/defineTool.js';
import { executeAgent } from '../executeAgent.js';
import { agentResult, childFrame, completedFrame, rootFrame } from './testUtils.js';

const add = defineTool({
    description: 'Add two numbers',
    input: {
        a: s.number(),
        b: s.number(),
    },
    output: s.number(),
    handler: ({ input: { a, b } }) => Promise.resolve(a + b),
});

const multiply = defineTool({
    description: 'Multiply two numbers',
    input: {
        a: s.number(),
        b: s.number(),
    },
    output: s.number(),
    handler: ({ input: { a, b } }) => Promise.resolve(a * b),
});

const square = defineTool({
    description: 'Square a number',
    input: {
        a: s.number(),
    },
    output: s.number(),
    handler: ({ input: { a } }) => Promise.resolve(a * a),
});

const tools = {
    add,
    multiply,
    square,
};

test('single function call', async () => {
    const script = parseScript([
        //
        'add(1, 2);',
    ]);

    const agent = createAgent({ tools, script });

    const result = await executeAgent({ agent });
    const expectedStack = rootFrame({
        status: 'finished',
        children: [
            completedFrame({
                node: 'call',
                value: 3,
            }),
        ],
    });

    expect(result).toEqual(agentResult({ ticks: 1 }));
    expect(agent.root).toEqual(expectedStack);
    expect(agent.status).toBe('finished');
});

test('multiple function calls', async () => {
    const script = parseScript([
        'const a = 1;',
        'const b = 2;',
        'const c = add(a, b);',
        'const d = multiply(c, 3);',
    ]);

    const agent = createAgent({ tools, script });

    let result = await executeAgent({ agent, ticks: 3 });
    const expectedStack = rootFrame({
        status: 'finished',
        variables: {
            a: 1,
            b: 2,
            c: 3,
            d: 9,
        },
        children: [
            // var a declaration
            completedFrame({
                node: 'var',
            }),
            // var b declaration
            completedFrame({
                node: 'var',
            }),
            // var c declaration
            completedFrame({
                node: 'var',
                children: [
                    completedFrame({
                        node: 'call',
                        value: 3,
                        children: [
                            // this
                            null,
                            // first arg
                            completedFrame({
                                node: 'ident',
                                value: 1,
                            }),
                            // second arg
                            completedFrame({
                                node: 'ident',
                                value: 2,
                            }),
                        ],
                    }),
                ],
            }),
            // var d declaration
            completedFrame({
                node: 'var',
                children: [
                    // call
                    completedFrame({
                        node: 'call',
                        value: 9,
                        children: [
                            // this
                            null,
                            // first arg
                            completedFrame({
                                node: 'ident',
                                value: 3,
                            }),
                            // second arg is literal
                        ],
                    }),
                ],
            }),
        ],
    });

    expect(result).toEqual(agentResult({ ticks: 2 }));
    expect(agent.root).toEqual(expectedStack);
    expect(agent.status).toBe('finished');

    result = await executeAgent({ agent, ticks: 1 });
    expect(result).toEqual(agentResult({ ticks: 0 }));
    expect(agent.root).toEqual(expectedStack);
    expect(agent.status).toBe('finished');
});

describe('nested function calls', () => {
    const script = parseScript(['add(square(1), square(2));']);

    test('run one tick at a time', async () => {
        const agent = createAgent({ tools, script });

        let result = await executeAgent({ agent, ticks: 1 });
        let expectedStack = rootFrame({
            children: [
                childFrame({
                    node: 'call',
                    children: [
                        // this arg
                        null,
                        // first arg
                        completedFrame({
                            node: 'call',
                            value: 1,
                        }),
                    ],
                }),
            ],
        });

        expect(result).toEqual(agentResult({ ticks: 1 }));
        expect(agent.root).toEqual(expectedStack);
        expect(agent.status).toBe('running');

        result = await executeAgent({ agent, ticks: 1 });
        expectedStack = rootFrame({
            children: [
                childFrame({
                    node: 'call',
                    children: [
                        // this arg
                        null,
                        // first arg
                        completedFrame({
                            node: 'call',
                            value: 1,
                        }),
                        // second arg
                        completedFrame({
                            node: 'call',
                            value: 4,
                        }),
                    ],
                }),
            ],
        });

        expect(result).toEqual(agentResult({ ticks: 1 }));

        result = await executeAgent({ agent, ticks: 1 });
        expectedStack = rootFrame({
            status: 'finished',
            children: [
                completedFrame({
                    node: 'call',
                    value: 5,
                    children: [
                        // this arg
                        null,
                        // first arg
                        completedFrame({
                            node: 'call',
                            value: 1,
                        }),
                        // second arg
                        completedFrame({
                            node: 'call',
                            value: 4,
                        }),
                    ],
                }),
            ],
        });
        expect(result).toEqual(agentResult({ ticks: 1 }));
        expect(agent.root).toEqual(expectedStack);
        expect(agent.status).toBe('finished');
    });

    test('run all ticks', async () => {
        const agent = createAgent({ tools, script });

        const result = await executeAgent({ agent });
        const expectedStack = rootFrame({
            status: 'finished',
            children: [
                completedFrame({
                    node: 'call',
                    value: 5,
                    children: [
                        // this arg
                        null,
                        // first arg
                        completedFrame({
                            node: 'call',
                            value: 1,
                        }),
                        // second arg
                        completedFrame({
                            node: 'call',
                            value: 4,
                        }),
                    ],
                }),
            ],
        });

        expect(result).toEqual(agentResult({ ticks: 3 }));
        expect(agent.root).toEqual(expectedStack);
        expect(agent.status).toBe('finished');
    });
});

test('module function', async () => {
    const script = parseScript([
        //
        'const a = 1;',
        'utils.add(2, a);',
    ]);

    const agent = createAgent({
        tools: {
            utils: tools,
        },
        script,
    });

    const result = await executeAgent({ agent });

    const expectedStack = rootFrame({
        status: 'finished',
        variables: {
            a: 1,
        },
        children: [
            // var a declaration
            completedFrame({
                node: 'var',
            }),
            // call
            completedFrame({
                node: 'call',
                value: 3,
                children: [
                    // this arg
                    null,
                    // first arg is literal
                    null,
                    // second arg
                    completedFrame({
                        node: 'ident',
                        value: 1,
                    }),
                ],
            }),
        ],
    });

    expect(result).toEqual(agentResult({ ticks: 1 }));
    expect(agent.root).toEqual(expectedStack);
    expect(agent.status).toBe('finished');
});

test('more than two arguments are turned into a single arg', async () => {
    const add = defineTool({
        description: 'Add three numbers',
        input: {
            a: s.number(),
            b: s.number(),
            c: s.number(),
        },
        output: s.number(),
        handler({ input }) {
            return input.a + input.b + input.c;
        },
    });

    const ast = parseScript([
        //
        'const b = 2;',
        'add({ a: 1, b: b, c: 3 });',
    ]);

    const agent = createAgent({
        tools: { add },
        script: ast,
    });

    const result = await executeAgent({ agent });

    const expectedStack = rootFrame({
        status: 'finished',
        variables: {
            b: 2,
        },
        children: [
            // var b declaration
            completedFrame({
                node: 'var',
            }),
            // call
            completedFrame({
                node: 'call',
                value: 6,
                children: [
                    // this arg
                    null,
                    // arg
                    completedFrame({
                        node: 'object',
                        value: { a: 1, b: 2, c: 3 },
                        children: [
                            // a key
                            null,
                            // a value
                            null,
                            // b key
                            null,
                            // b value
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

    expect(result).toEqual(agentResult({ ticks: 0 }));
    expect(agent.root).toEqual(expectedStack);
    expect(agent.status).toBe('finished');
});

test('explicit single arg literal', async () => {
    const add = defineTool({
        description: 'Add three numbers',
        input: s.object({
            props: {
                a: s.number(),
                b: s.number(),
            },
        }),
        output: s.number(),
        handler({ input }) {
            return input.a + input.b;
        },
    });

    const ast = parseScript('add({ a: 1, b: 2 })');
    const agent = createAgent({
        tools: { add },
        script: ast,
    });
    const result = await executeAgent({ agent });

    const expectedStack = rootFrame({
        status: 'finished',
        children: [
            completedFrame({
                node: 'call',
                value: 3,
                // arg is a literal
            }),
        ],
    });

    expect(result).toEqual(agentResult({ ticks: 0 }));
    expect(agent.root).toEqual(expectedStack);
    expect(agent.status).toBe('finished');
});

test('explicit single arg object', async () => {
    const add = defineTool({
        description: 'Add three numbers',
        input: s.object({
            props: {
                a: s.number(),
                b: s.number(),
            },
        }),
        output: s.number(),
        handler({ input }) {
            return input.a + input.b;
        },
    });

    const ast = parseScript([
        //
        'const b = 2;',
        'add({ a: 1, b });',
    ]);
    const agent = createAgent({
        tools: { add },
        script: ast,
    });
    const result = await executeAgent({ agent });

    const expectedStack = rootFrame({
        status: 'finished',
        variables: {
            b: 2,
        },
        children: [
            // var b declaration
            completedFrame({
                node: 'var',
            }),
            // call
            completedFrame({
                node: 'call',
                value: 3,
                children: [
                    // this arg
                    null,
                    // arg
                    completedFrame({
                        node: 'object',
                        value: { a: 1, b: 2 },
                        children: [
                            // a key
                            null,
                            // a value
                            null,
                            // b key
                            null,
                            // b value
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

    expect(result).toEqual(agentResult({ ticks: 0 }));
    expect(agent.root).toEqual(expectedStack);
    expect(agent.status).toBe('finished');
});

test('agent output', async () => {
    const ast = parseScript('result = add(1, 2)');
    const agent = createAgent({
        tools: { add },
        output: s.number(),
        script: ast,
    });
    const result = await executeAgent({ agent });

    const expectedStack = rootFrame({
        status: 'finished',

        children: [
            completedFrame({
                node: 'assign',
                value: 3,
                children: [
                    // left side
                    null,
                    // right side
                    completedFrame({
                        node: 'call',
                        value: 3,
                    }),
                ],
            }),
        ],
        variables: { result: 3 },
    });

    expect(result).toEqual(agentResult({ ticks: 1 }));
    expect(agent.root).toEqual(expectedStack);
    expect(agent.status).toBe('finished');
    expect(agent.output).toBe(3);
});
