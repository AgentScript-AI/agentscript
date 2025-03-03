import { expect, test } from 'vitest';

import { parseScript } from '@agentscript-ai/parser';

import { createAgent } from '../../agent/createAgent.js';
import { executeAgent } from '../executeAgent.js';
import { agentResult, completedFrame, rootFrame } from './testUtils.js';

test('new Date()', async () => {
    const script = parseScript('new Date()');

    const agent = createAgent({ script });

    const result = await executeAgent({ agent });
    const expectedStack = rootFrame({
        status: 'done',
        children: [
            completedFrame({
                node: 'new',
                value: expect.any(Date),
            }),
        ],
    });

    expect(result).toEqual(agentResult({ ticks: 0 }));
    expect(agent.root).toEqual(expectedStack);
    expect(agent.status).toBe('done');
});

test('literal.toString()', async () => {
    const script = parseScript('true.toString()');

    const agent = createAgent({ script });
    const result = await executeAgent({ agent });

    const expectedStack = rootFrame({
        status: 'done',
        children: [
            // toString()
            completedFrame({
                node: 'call',
                value: 'true',
            }),
        ],
    });

    expect(result).toEqual(agentResult({ ticks: 0 }));
    expect(agent.root).toEqual(expectedStack);
    expect(agent.status).toBe('done');
});

test('variable.toString()', async () => {
    const script = parseScript([
        //
        'const a = true;',
        'a.toString()',
    ]);
    const agent = createAgent({ script });
    const result = await executeAgent({ agent });

    const expectedStack = rootFrame({
        status: 'done',
        variables: { a: true },
        children: [
            // variable init
            completedFrame({ node: 'var' }),
            // toString()
            completedFrame({
                node: 'call',
                value: 'true',
                children: [
                    // this
                    completedFrame({
                        node: 'ident',
                        value: true,
                    }),
                ],
            }),
        ],
    });

    expect(result).toEqual(agentResult({ ticks: 0 }));
    expect(agent.root).toEqual(expectedStack);
    expect(agent.status).toBe('done');
});

test('Number()', async () => {
    const script = parseScript('Number("1")');
    const agent = createAgent({ script });

    const result = await executeAgent({ agent });

    const expectedStack = rootFrame({
        status: 'done',
        children: [
            completedFrame({
                node: 'call',
                value: 1,
            }),
        ],
    });

    expect(result).toEqual(agentResult({ ticks: 0 }));
    expect(agent.root).toEqual(expectedStack);
    expect(agent.status).toBe('done');
});

test('Boolean("true")', async () => {
    const script = parseScript('Boolean("true")');
    const agent = createAgent({ script });
    const result = await executeAgent({ agent });

    const expectedStack = rootFrame({
        status: 'done',
        children: [
            completedFrame({
                node: 'call',
                value: true,
            }),
        ],
    });

    expect(result).toEqual(agentResult({ ticks: 0 }));
    expect(agent.root).toEqual(expectedStack);
    expect(agent.status).toBe('done');
});

test('Boolean(true.toString())', async () => {
    const script = parseScript('Boolean(true.toString())');
    const agent = createAgent({ script });
    const result = await executeAgent({ agent });

    const expectedStack = rootFrame({
        status: 'done',
        children: [
            completedFrame({
                node: 'call',
                value: true,
                children: [
                    // this arg
                    null,
                    // toString()
                    completedFrame({
                        node: 'call',
                        value: 'true',
                    }),
                ],
            }),
        ],
    });

    expect(result).toEqual(agentResult({ ticks: 0 }));
    expect(agent.root).toEqual(expectedStack);
    expect(agent.status).toBe('done');
});

test('String()', async () => {
    const script = parseScript('String(1)');
    const agent = createAgent({ script });
    const result = await executeAgent({ agent });

    const expectedStack = rootFrame({
        status: 'done',
        children: [
            completedFrame({
                node: 'call',
                value: '1',
            }),
        ],
    });

    expect(result).toEqual(agentResult({ ticks: 0 }));
    expect(agent.root).toEqual(expectedStack);
    expect(agent.status).toBe('done');
});
