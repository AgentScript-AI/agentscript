import { expect, test } from 'vitest';

import * as s from '@agentscript-ai/schema';
import { joinLines } from '@agentscript-ai/utils';

import { createAgent } from '../../agent/createAgent.js';
import { parseScript } from '../../parser/parseScript.js';
import { executeAgent } from '../executeAgent.js';
import { completedFrame, rootFrame } from './testUtils.js';
import { defineTool } from '../../tools/defineTool.js';

test('array variable map with inline arrow function', async () => {
    const code = joinLines([
        //
        'const a = [1, 2, 3]',
        'const b = a.map(x => x * 2)',
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
            completedFrame({ node: 'var' }),
            // var b declaration
            completedFrame({
                node: 'var',
                children: [
                    // array map call
                    completedFrame({
                        node: 'call',
                        value: [2, 4, 6],
                        children: [
                            // this arg
                            completedFrame({
                                node: 'ident',
                                value: [1, 2, 3],
                            }),
                            // array map item / operator call
                            completedFrame({
                                node: 'operator',
                                value: 2,
                                variables: {
                                    x: 1,
                                },
                                children: [
                                    // left operand
                                    completedFrame({
                                        node: 'ident',
                                        value: 1,
                                    }),
                                ],
                            }),
                            // array map item / operator call
                            completedFrame({
                                node: 'operator',
                                value: 4,
                                variables: {
                                    x: 2,
                                },
                                children: [
                                    // left operand
                                    completedFrame({
                                        node: 'ident',
                                        value: 2,
                                    }),
                                ],
                            }),
                            // array map item / operator call
                            completedFrame({
                                node: 'operator',
                                value: 6,
                                variables: {
                                    x: 3,
                                },
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
            }),
        ],
        variables: {
            a: [1, 2, 3],
            b: [2, 4, 6],
        },
    });

    expect(agent.root).toEqual(expectedStack);
    expect(agent.status).toBe('finished');
});

test('array literal map with inline arrow function', async () => {
    const code = joinLines([
        //
        '[1, 2].map(x => x * 2)',
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
            // array map call
            completedFrame({
                node: 'call',
                value: [2, 4],
                children: [
                    // this arg is literal
                    null,
                    // array map item / operator call
                    completedFrame({
                        node: 'operator',
                        value: 2,
                        variables: {
                            x: 1,
                        },
                        children: [
                            // left operand
                            completedFrame({
                                node: 'ident',
                                value: 1,
                            }),
                        ],
                    }),
                    // array map item / operator call
                    completedFrame({
                        node: 'operator',
                        value: 4,
                        variables: {
                            x: 2,
                        },
                        children: [
                            // left operand
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

test('array member map with inline arrow function', async () => {
    const code = joinLines([
        //
        'const a = { b: [1, 2] }',
        'a.b.map(x => x * 2)',
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
            a: { b: [1, 2] },
        },
        children: [
            // var a declaration
            completedFrame({ node: 'var' }),
            // array map call
            completedFrame({
                node: 'call',
                value: [2, 4],
                children: [
                    // this arg is member
                    completedFrame({
                        node: 'member',
                        value: [1, 2],
                        children: [
                            // member object
                            completedFrame({
                                node: 'ident',
                                value: { b: [1, 2] },
                            }),
                        ],
                    }),
                    // array map item / operator call
                    completedFrame({
                        node: 'operator',
                        value: 2,
                        variables: {
                            x: 1,
                        },
                        children: [
                            // left operand
                            completedFrame({
                                node: 'ident',
                                value: 1,
                            }),
                        ],
                    }),
                    // array map item / operator call
                    completedFrame({
                        node: 'operator',
                        value: 4,
                        variables: {
                            x: 2,
                        },
                        children: [
                            // left operand
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

test('array variable map with block arrow function', async () => {
    const code = joinLines([
        //
        'const a = [1, 2, 3]',
        'const b = a.map(x => {',
        '    const y = x * 2',
        '    return y',
        '})',
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
                node: 'var',
            }),
            // var b declaration
            completedFrame({
                node: 'var',
                children: [
                    // array map call
                    completedFrame({
                        node: 'call',
                        value: [2, 4, 6],
                        children: [
                            // this arg
                            completedFrame({
                                node: 'ident',
                                value: [1, 2, 3],
                            }),
                            // item 0
                            completedFrame({
                                node: 'block',
                                value: 2,
                                variables: {
                                    x: 1,
                                    y: 2,
                                },
                                children: [
                                    // var y declaration
                                    completedFrame({
                                        node: 'var',
                                        children: [
                                            // operator call
                                            completedFrame({
                                                node: 'operator',
                                                value: 2,
                                                children: [
                                                    // left operand
                                                    completedFrame({
                                                        node: 'ident',
                                                        value: 1,
                                                    }),
                                                    // right operand is literal
                                                ],
                                            }),
                                        ],
                                    }),
                                    // return statement
                                    completedFrame({
                                        node: 'return',
                                        children: [
                                            // return value
                                            completedFrame({
                                                node: 'ident',
                                                value: 2,
                                            }),
                                        ],
                                    }),
                                ],
                            }),

                            // item 1
                            completedFrame({
                                node: 'block',
                                value: 4,
                                variables: {
                                    x: 2,
                                    y: 4,
                                },
                                children: [
                                    // var y declaration
                                    completedFrame({
                                        node: 'var',
                                        children: [
                                            // operator call
                                            completedFrame({
                                                node: 'operator',
                                                value: 4,
                                                children: [
                                                    // left operand
                                                    completedFrame({
                                                        node: 'ident',
                                                        value: 2,
                                                    }),
                                                    // right operand is literal
                                                ],
                                            }),
                                        ],
                                    }),
                                    // return statement
                                    completedFrame({
                                        node: 'return',
                                        children: [
                                            // return value
                                            completedFrame({
                                                node: 'ident',
                                                value: 4,
                                            }),
                                        ],
                                    }),
                                ],
                            }),

                            // item 2
                            completedFrame({
                                node: 'block',
                                value: 6,
                                variables: {
                                    x: 3,
                                    y: 6,
                                },
                                children: [
                                    // var y declaration
                                    completedFrame({
                                        node: 'var',
                                        children: [
                                            // operator call
                                            completedFrame({
                                                node: 'operator',
                                                value: 6,
                                                children: [
                                                    // left operand
                                                    completedFrame({
                                                        node: 'ident',
                                                        value: 3,
                                                    }),
                                                    // right operand is literal
                                                ],
                                            }),
                                        ],
                                    }),
                                    // return statement
                                    completedFrame({
                                        node: 'return',
                                        children: [
                                            // return value
                                            completedFrame({
                                                node: 'ident',
                                                value: 6,
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
            a: [1, 2, 3],
            b: [2, 4, 6],
        },
    });

    expect(agent.root).toEqual(expectedStack);
    expect(agent.status).toBe('finished');
});

test('array variable map with block arrow function and nested return', async () => {
    const code = joinLines([
        //
        'const a = [1, 2]',
        'const b = a.map(x => {',
        '    if (x < 2) {',
        '        return 0',
        '    }',
        '',
        '    return x',
        '})',
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
                node: 'var',
            }),
            // var b declaration
            completedFrame({
                node: 'var',
                children: [
                    // array map call
                    completedFrame({
                        node: 'call',
                        value: [0, 2],
                        children: [
                            // this arg
                            completedFrame({
                                node: 'ident',
                                value: [1, 2],
                            }),
                            // item 0
                            completedFrame({
                                node: 'block',
                                value: 0,
                                variables: {
                                    x: 1,
                                },
                                children: [
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
                                            // then statement
                                            completedFrame({
                                                node: 'block',
                                                children: [
                                                    completedFrame({
                                                        node: 'return',
                                                        // literal return value
                                                    }),
                                                ],
                                            }),
                                        ],
                                    }),
                                ],
                            }),
                            // item 1
                            completedFrame({
                                node: 'block',
                                value: 2,
                                variables: {
                                    x: 2,
                                },
                                children: [
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
                                                        value: 2,
                                                    }),
                                                ],
                                            }),
                                        ],
                                    }),
                                    // return statement
                                    completedFrame({
                                        node: 'return',
                                        children: [
                                            // return value
                                            completedFrame({
                                                node: 'ident',
                                                value: 2,
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
            a: [1, 2],
            b: [0, 2],
        },
    });

    expect(agent.root).toEqual(expectedStack);
    expect(agent.status).toBe('finished');
});

test('array variable map with async tool inline', async () => {
    const multiply = defineTool({
        description: 'Multiplies two numbers',
        input: {
            x: s.number(),
            y: s.number(),
        },
        output: s.number(),
        handler: ({ input }) => {
            return Promise.resolve(input.x * input.y);
        },
    });

    const code = joinLines([
        //
        'const a = [1, 2, 3]',
        'const b = a.map(x => multiply(x, 2))',
    ]);

    const agent = createAgent({
        tools: { multiply },
        script: parseScript(code),
    });

    await executeAgent({ agent });

    const expectedStack = rootFrame({
        status: 'finished',
        children: [
            // var a declaration
            completedFrame({
                node: 'var',
            }),
            // var b declaration
            completedFrame({
                node: 'var',
                children: [
                    // array map call
                    completedFrame({
                        node: 'call',
                        value: [2, 4, 6],
                        children: [
                            // this arg
                            completedFrame({
                                node: 'ident',
                                value: [1, 2, 3],
                            }),
                            // array map item / tool call
                            completedFrame({
                                node: 'call',
                                value: 2,
                                variables: {
                                    x: 1,
                                },
                                children: [
                                    // this
                                    null,
                                    // first parameter
                                    completedFrame({
                                        node: 'ident',
                                        value: 1,
                                    }),
                                    // second parameter (literal)
                                ],
                            }),
                            // array map item / tool call
                            completedFrame({
                                node: 'call',
                                value: 4,
                                variables: {
                                    x: 2,
                                },
                                children: [
                                    // this
                                    null,
                                    // first parameter
                                    completedFrame({
                                        node: 'ident',
                                        value: 2,
                                    }),
                                    // second parameter (literal)
                                ],
                            }),
                            // array map item / tool call
                            completedFrame({
                                node: 'call',
                                value: 6,
                                variables: {
                                    x: 3,
                                },
                                children: [
                                    // this
                                    null,
                                    // first parameter
                                    completedFrame({
                                        node: 'ident',
                                        value: 3,
                                    }),
                                    // second parameter (literal)
                                ],
                            }),
                        ],
                    }),
                ],
            }),
        ],
        variables: {
            a: [1, 2, 3],
            b: [2, 4, 6],
        },
    });
    expect(agent.root).toEqual(expectedStack);
    expect(agent.status).toBe('finished');
});

test('array variable map with async tool in block', async () => {
    const multiply = defineTool({
        description: 'Multiplies two numbers',
        input: {
            x: s.number(),
            y: s.number(),
        },
        output: s.number(),
        handler: ({ input }) => {
            return Promise.resolve(input.x * input.y);
        },
    });

    const code = joinLines([
        //
        'const a = [1, 2, 3]',
        'const b = a.map(x => {',
        '    const y = multiply(x, 2)',
        '    return y',
        '})',
    ]);

    const agent = createAgent({
        tools: { multiply },
        script: parseScript(code),
    });

    await executeAgent({ agent });

    const expectedStack = rootFrame({
        status: 'finished',
        children: [
            // var a declaration
            completedFrame({
                node: 'var',
            }),
            // var b declaration
            completedFrame({
                node: 'var',
                children: [
                    // array map call
                    completedFrame({
                        node: 'call',
                        value: [2, 4, 6],
                        children: [
                            // this arg
                            completedFrame({
                                node: 'ident',
                                value: [1, 2, 3],
                            }),
                            // array map item block
                            completedFrame({
                                node: 'block',
                                value: 2,
                                variables: {
                                    x: 1,
                                    y: 2,
                                },
                                children: [
                                    // var y declaration
                                    completedFrame({
                                        node: 'var',
                                        children: [
                                            // tool call
                                            completedFrame({
                                                node: 'call',
                                                value: 2,
                                                children: [
                                                    // this
                                                    null,
                                                    // first parameter
                                                    completedFrame({
                                                        node: 'ident',
                                                        value: 1,
                                                    }),
                                                ],
                                            }),
                                        ],
                                    }),
                                    // return statement
                                    completedFrame({
                                        node: 'return',
                                        children: [
                                            // return value
                                            completedFrame({
                                                node: 'ident',
                                                value: 2,
                                            }),
                                        ],
                                    }),
                                ],
                            }),
                            // array map item block
                            completedFrame({
                                node: 'block',
                                value: 4,
                                variables: {
                                    x: 2,
                                    y: 4,
                                },
                                children: [
                                    // var y declaration
                                    completedFrame({
                                        node: 'var',
                                        children: [
                                            // tool call
                                            completedFrame({
                                                node: 'call',
                                                value: 4,
                                                children: [
                                                    // this
                                                    null,
                                                    // first parameter
                                                    completedFrame({
                                                        node: 'ident',
                                                        value: 2,
                                                    }),
                                                ],
                                            }),
                                        ],
                                    }),
                                    // return statement
                                    completedFrame({
                                        node: 'return',
                                        children: [
                                            // return value
                                            completedFrame({
                                                node: 'ident',
                                                value: 4,
                                            }),
                                        ],
                                    }),
                                ],
                            }),
                            // array map item block
                            completedFrame({
                                node: 'block',
                                value: 6,
                                variables: {
                                    x: 3,
                                    y: 6,
                                },
                                children: [
                                    // var y declaration
                                    completedFrame({
                                        node: 'var',
                                        children: [
                                            // tool call
                                            completedFrame({
                                                node: 'call',
                                                value: 6,
                                                children: [
                                                    // this
                                                    null,
                                                    // first parameter
                                                    completedFrame({
                                                        node: 'ident',
                                                        value: 3,
                                                    }),
                                                ],
                                            }),
                                        ],
                                    }),
                                    // return statement
                                    completedFrame({
                                        node: 'return',
                                        children: [
                                            // return value
                                            completedFrame({
                                                node: 'ident',
                                                value: 6,
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
            a: [1, 2, 3],
            b: [2, 4, 6],
        },
    });

    expect(agent.root).toEqual(expectedStack);
    expect(agent.status).toBe('finished');
});

// todo: test array filter
// todo: test array reduce
// todo: test array every
// todo: test array some
// todo: test array find
// todo: test array findIndex
// todo: test array includes
// todo: test array indexOf
// todo: test array lastIndexOf
// todo: test array concat
// todo: test array slice
// todo: test array splice
// todo: test array reverse
// todo: test array sort
