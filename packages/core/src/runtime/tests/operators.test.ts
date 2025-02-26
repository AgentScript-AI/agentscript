import { expect, test } from 'vitest';

import { parseScript } from '@agentscript-ai/parser';
import * as s from '@agentscript-ai/schema';

import { createAgent } from '../../agent/createAgent.js';
import { executeAgent } from '../executeAgent.js';
import { completedFrame, rootFrame } from './testUtils.js';
import { defineTool } from '../../tools/defineTool.js';

test('add operator', async () => {
    const script = parseScript([
        //
        'const a = 2;',
        'const b = 1 + a;',
    ]);

    const agent = createAgent({ script });

    await executeAgent({ agent });

    const expectedStack = rootFrame({
        status: 'done',
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
                        node: 'binary',
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
    expect(agent.status).toBe('done');
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
        status: 'done',
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
                        node: 'binary',
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
    expect(agent.status).toBe('done');
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
        status: 'done',
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
                        node: 'binary',
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
    expect(agent.status).toBe('done');
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
        status: 'done',
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
                        node: 'binary',
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
    expect(agent.status).toBe('done');
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
        status: 'done',
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
                        node: 'binary',
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
    expect(agent.status).toBe('done');
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
        status: 'done',
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
                        node: 'binary',
                        value: true,
                    }),
                ],
            }),
            completedFrame({
                node: 'var',
                children: [
                    completedFrame({
                        node: 'binary',
                        value: true,
                    }),
                ],
            }),
            completedFrame({
                node: 'var',
                children: [
                    completedFrame({
                        node: 'binary',
                        value: true,
                    }),
                ],
            }),
            completedFrame({
                node: 'var',
                children: [
                    completedFrame({
                        node: 'binary',
                        value: true,
                    }),
                ],
            }),
        ],
    });

    expect(agent.root).toEqual(expectedStack);
    expect(agent.status).toBe('done');
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
        status: 'done',
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
                        node: 'binary',
                        value: true,
                    }),
                ],
            }),
            completedFrame({
                node: 'var',
                children: [
                    completedFrame({
                        node: 'binary',
                        value: true,
                    }),
                ],
            }),
            completedFrame({
                node: 'var',
                children: [
                    completedFrame({
                        node: 'binary',
                        value: true,
                    }),
                ],
            }),
            completedFrame({
                node: 'var',
                children: [
                    completedFrame({
                        node: 'binary',
                        value: true,
                    }),
                ],
            }),
        ],
    });

    expect(agent.root).toEqual(expectedStack);
    expect(agent.status).toBe('done');
});

test('logical AND operator', async () => {
    // Use a tool to force adding stack frames
    const ident = defineTool({
        description: 'Returns the value of the variable',
        input: {
            value: s.unknown(),
        },
        output: s.unknown(),
        handler: ({ input }) => input.value,
    });

    const script = parseScript([
        'const a = ident(true) && ident(true);',
        'const b = ident(true) && ident(false);',
        'const c = ident(false) && ident(true);',
        'const d = ident(false) && ident(false);',
        'const e = ident(null) && ident("default");',
        'const f = ident("foo") && ident("bar");',
    ]);

    const agent = createAgent({ script, tools: { ident } });

    await executeAgent({ agent });

    const expectedStack = rootFrame({
        status: 'done',
        variables: {
            a: true,
            b: false,
            c: false,
            d: false,
            e: null,
            f: 'bar',
        },
        children: [
            // var a declaration
            completedFrame({
                node: 'var',
                children: [
                    completedFrame({
                        node: 'logical',
                        value: true,
                        children: [
                            // left operand
                            completedFrame({
                                node: 'call',
                                value: true,
                            }),
                            // right operand
                            completedFrame({
                                node: 'call',
                                value: true,
                            }),
                        ],
                    }),
                ],
            }),
            // var b declaration
            completedFrame({
                node: 'var',
                children: [
                    completedFrame({
                        node: 'logical',
                        value: false,
                        children: [
                            // left operand
                            completedFrame({
                                node: 'call',
                                value: true,
                            }),
                            // right operand
                            completedFrame({
                                node: 'call',
                                value: false,
                            }),
                        ],
                    }),
                ],
            }),
            // var c declaration
            completedFrame({
                node: 'var',
                children: [
                    completedFrame({
                        node: 'logical',
                        value: false,
                        children: [
                            // left operand
                            completedFrame({
                                node: 'call',
                                value: false,
                            }),
                        ],
                    }),
                ],
            }),
            // var d declaration
            completedFrame({
                node: 'var',
                children: [
                    completedFrame({
                        node: 'logical',
                        value: false,
                        children: [
                            // left operand
                            completedFrame({
                                node: 'call',
                                value: false,
                            }),
                        ],
                    }),
                ],
            }),
            // var e declaration
            completedFrame({
                node: 'var',
                children: [
                    completedFrame({
                        node: 'logical',
                        value: null,
                        children: [
                            // left operand
                            completedFrame({
                                node: 'call',
                                value: null,
                            }),
                        ],
                    }),
                ],
            }),
            // var f declaration
            completedFrame({
                node: 'var',
                children: [
                    completedFrame({
                        node: 'logical',
                        value: 'bar',
                        children: [
                            // left operand
                            completedFrame({
                                node: 'call',
                                value: 'foo',
                            }),
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

test('logical OR operator', async () => {
    const ident = defineTool({
        description: 'Returns the value of the variable',
        input: {
            value: s.unknown(),
        },
        output: s.unknown(),
        handler: ({ input }) => input.value,
    });

    const script = parseScript([
        'const a = ident(true) || ident(true);',
        'const b = ident(true) || ident(false);',
        'const c = ident(false) || ident(true);',
        'const d = ident(false) || ident(false);',
        'const e = ident("foo") || ident("bar");',
        'const f = ident("") || ident("default");',
    ]);

    const agent = createAgent({ script, tools: { ident } });

    await executeAgent({ agent });

    const expectedStack = rootFrame({
        status: 'done',
        variables: {
            a: true,
            b: true,
            c: true,
            d: false,
            e: 'foo',
            f: 'default',
        },
        children: [
            // var a declaration
            completedFrame({
                node: 'var',
                children: [
                    completedFrame({
                        node: 'logical',
                        value: true,
                        children: [
                            // left operand
                            completedFrame({
                                node: 'call',
                                value: true,
                            }),
                        ],
                    }),
                ],
            }),
            // var b declaration
            completedFrame({
                node: 'var',
                children: [
                    completedFrame({
                        node: 'logical',
                        value: true,
                        children: [
                            // left operand
                            completedFrame({
                                node: 'call',
                                value: true,
                            }),
                        ],
                    }),
                ],
            }),
            // var c declaration
            completedFrame({
                node: 'var',
                children: [
                    completedFrame({
                        node: 'logical',
                        value: true,
                        children: [
                            // left operand
                            completedFrame({
                                node: 'call',
                                value: false,
                            }),
                            // right operand
                            completedFrame({
                                node: 'call',
                                value: true,
                            }),
                        ],
                    }),
                ],
            }),
            // var d declaration
            completedFrame({
                node: 'var',
                children: [
                    completedFrame({
                        node: 'logical',
                        value: false,
                        children: [
                            // left operand
                            completedFrame({
                                node: 'call',
                                value: false,
                            }),
                            // right operand
                            completedFrame({
                                node: 'call',
                                value: false,
                            }),
                        ],
                    }),
                ],
            }),
            // var e declaration
            completedFrame({
                node: 'var',
                children: [
                    completedFrame({
                        node: 'logical',
                        value: 'foo',
                        children: [
                            // left operand
                            completedFrame({
                                node: 'call',
                                value: 'foo',
                            }),
                        ],
                    }),
                ],
            }),
            // var f declaration
            completedFrame({
                node: 'var',
                children: [
                    completedFrame({
                        node: 'logical',
                        value: 'default',
                        children: [
                            // left operand
                            completedFrame({
                                node: 'call',
                                value: '',
                            }),
                            // right operand
                            completedFrame({
                                node: 'call',
                                value: 'default',
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

test('nullish coalescing operator', async () => {
    const ident = defineTool({
        description: 'Returns the value of the variable',
        input: {
            value: s.unknown(),
        },
        output: s.unknown(),
        handler: ({ input }) => input.value,
    });

    const script = parseScript([
        'const a = ident(0) ?? ident(1);',
        'const b = ident("") ?? ident("default");',
        'const c = ident(null) ?? ident("default");',
        'const d = ident(undefined) ?? ident("default");',
        'const e = ident(false) ?? ident("default");',
    ]);

    const agent = createAgent({ script, tools: { ident } });

    await executeAgent({ agent });

    const expectedStack = rootFrame({
        status: 'done',
        variables: {
            a: 0,
            b: '',
            c: 'default',
            d: 'default',
            e: false,
        },
        children: [
            // var a declaration
            completedFrame({
                node: 'var',
                children: [
                    completedFrame({
                        node: 'logical',
                        value: 0,
                        children: [
                            // left operand
                            completedFrame({
                                node: 'call',
                                value: 0,
                            }),
                        ],
                    }),
                ],
            }),
            // var b declaration
            completedFrame({
                node: 'var',
                children: [
                    completedFrame({
                        node: 'logical',
                        value: '',
                        children: [
                            // left operand
                            completedFrame({
                                node: 'call',
                                value: '',
                            }),
                        ],
                    }),
                ],
            }),
            // var c declaration
            completedFrame({
                node: 'var',
                children: [
                    completedFrame({
                        node: 'logical',
                        value: 'default',
                        children: [
                            // left operand
                            completedFrame({
                                node: 'call',
                                value: null,
                            }),
                            // right operand
                            completedFrame({
                                node: 'call',
                                value: 'default',
                            }),
                        ],
                    }),
                ],
            }),
            // var d declaration
            completedFrame({
                node: 'var',
                children: [
                    completedFrame({
                        node: 'logical',
                        value: 'default',
                        children: [
                            // left operand
                            completedFrame({
                                node: 'call',
                                value: undefined,
                            }),
                            // right operand
                            completedFrame({
                                node: 'call',
                                value: 'default',
                            }),
                        ],
                    }),
                ],
            }),
            // var e declaration
            completedFrame({
                node: 'var',
                children: [
                    completedFrame({
                        node: 'logical',
                        value: false,
                        children: [
                            // left operand
                            completedFrame({
                                node: 'call',
                                value: false,
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

test('post increment variable', async () => {
    const script = parseScript([
        //
        'const a = 1;',
        'a++;',
    ]);

    const agent = createAgent({ script });

    await executeAgent({ agent });

    const expectedStack = rootFrame({
        status: 'done',
        variables: {
            a: 2,
        },
        children: [
            completedFrame({ node: 'var' }),
            completedFrame({
                node: 'update',
                value: 1,
                children: [completedFrame({ node: 'ident', value: 1 })],
            }),
        ],
    });

    expect(agent.root).toEqual(expectedStack);
    expect(agent.status).toBe('done');
});

test('pre increment variable', async () => {
    const script = parseScript([
        //
        'const a = 1;',
        '++a;',
    ]);

    const agent = createAgent({ script });

    await executeAgent({ agent });

    const expectedStack = rootFrame({
        status: 'done',
        variables: {
            a: 2,
        },
        children: [
            completedFrame({ node: 'var' }),
            completedFrame({
                node: 'update',
                value: 2,
                children: [completedFrame({ node: 'ident', value: 1 })],
            }),
        ],
    });

    expect(agent.root).toEqual(expectedStack);
    expect(agent.status).toBe('done');
});

test('post decrement variable', async () => {
    const script = parseScript([
        //
        'const a = 1;',
        'a--;',
    ]);

    const agent = createAgent({ script });

    await executeAgent({ agent });

    const expectedStack = rootFrame({
        status: 'done',
        variables: {
            a: 0,
        },
        children: [
            completedFrame({ node: 'var' }),
            completedFrame({
                node: 'update',
                value: 1,
                children: [completedFrame({ node: 'ident', value: 1 })],
            }),
        ],
    });

    expect(agent.root).toEqual(expectedStack);
    expect(agent.status).toBe('done');
});

test('pre decrement variable', async () => {
    const script = parseScript([
        //
        'const a = 1;',
        '--a;',
    ]);

    const agent = createAgent({ script });

    await executeAgent({ agent });

    const expectedStack = rootFrame({
        status: 'done',
        variables: {
            a: 0,
        },
        children: [
            completedFrame({ node: 'var' }),
            completedFrame({
                node: 'update',
                value: 0,
                children: [completedFrame({ node: 'ident', value: 1 })],
            }),
        ],
    });

    expect(agent.root).toEqual(expectedStack);
    expect(agent.status).toBe('done');
});

test('negate operator', async () => {
    const script = parseScript([
        //
        'const a = 1;',
        'const b = -a;',
    ]);

    const agent = createAgent({ script });

    await executeAgent({ agent });

    const expectedStack = rootFrame({
        status: 'done',
        variables: {
            a: 1,
            b: -1,
        },
        children: [
            completedFrame({ node: 'var' }),
            completedFrame({
                node: 'var',
                children: [
                    completedFrame({
                        node: 'unary',
                        value: -1,
                        children: [completedFrame({ node: 'ident', value: 1 })],
                    }),
                ],
            }),
        ],
    });

    expect(agent.root).toEqual(expectedStack);
    expect(agent.status).toBe('done');
});

test('plus operator', async () => {
    const script = parseScript([
        //
        'const a = "1";',
        'const b = +a;',
    ]);

    const agent = createAgent({ script });

    await executeAgent({ agent });

    const expectedStack = rootFrame({
        status: 'done',
        variables: {
            a: '1',
            b: 1,
        },
        children: [
            completedFrame({ node: 'var' }),
            completedFrame({
                node: 'var',
                children: [
                    completedFrame({
                        node: 'unary',
                        value: 1,
                        children: [completedFrame({ node: 'ident', value: '1' })],
                    }),
                ],
            }),
        ],
    });

    expect(agent.root).toEqual(expectedStack);
    expect(agent.status).toBe('done');
});

test('typeof operator', async () => {
    const script = parseScript(['const a = "foo";', 'const b = typeof a;']);

    const agent = createAgent({ script });

    await executeAgent({ agent });

    const expectedStack = rootFrame({
        status: 'done',
        variables: {
            a: 'foo',
            b: 'string',
        },
        children: [
            completedFrame({ node: 'var' }),
            completedFrame({
                node: 'var',
                children: [
                    completedFrame({
                        node: 'unary',
                        value: 'string',
                        children: [completedFrame({ node: 'ident', value: 'foo' })],
                    }),
                ],
            }),
        ],
    });

    expect(agent.root).toEqual(expectedStack);
    expect(agent.status).toBe('done');
});

test('not operator', async () => {
    const script = parseScript([
        //
        'const a = true;',
        'const b = !a;',
    ]);

    const agent = createAgent({ script });

    await executeAgent({ agent });

    const expectedStack = rootFrame({
        status: 'done',
        variables: {
            a: true,
            b: false,
        },
        children: [
            completedFrame({ node: 'var' }),
            completedFrame({
                node: 'var',
                children: [
                    completedFrame({
                        node: 'unary',
                        value: false,
                        children: [completedFrame({ node: 'ident', value: true })],
                    }),
                ],
            }),
        ],
    });

    expect(agent.root).toEqual(expectedStack);
    expect(agent.status).toBe('done');
});
