import { expect, test } from 'vitest';

import * as s from '@agentscript-ai/schema';

import type { AgentSerialized } from './agentTypes.js';
import { createAgent } from './createAgent.js';
import { deserializeAgent } from './deserializeAgent.js';
import { serializeAgent } from './serializeAgent.js';
import { parseScript } from '../parser/parseScript.js';
import { executeAgent } from '../runtime/executeAgent.js';
import { childFrame, rootFrame } from '../runtime/tests/testUtils.js';
import { defineTool } from '../tools/defineTool.js';

test('serialize not finished execution', async () => {
    const tool = defineTool({
        input: {
            foo: s.string(),
        },
        output: s.string(),
        // make it async, so execution can be paused
        handler: ({ input }) => Promise.resolve(input.foo),
    });

    const script = parseScript([
        'const foo = tool("foo");',
        'const bar = tool("bar");',
        'const baz = tool(foo + bar);',
    ]);

    let agent = createAgent({
        tools: { tool },
        script,
    });

    await executeAgent({ agent, ticks: 1 });

    let expectedStack = rootFrame({
        children: [
            // var frame
            childFrame({
                status: 'finished',
                trace: '0:0',
                children: [
                    // tool call frame
                    childFrame({
                        status: 'finished',
                        trace: '0:0:0',
                        value: 'foo',
                        children: [
                            // tool param
                            childFrame({
                                status: 'finished',
                                trace: '0:0:0:0',
                                value: 'foo',
                            }),
                        ],
                    }),
                ],
            }),
        ],
        variables: {
            foo: 'foo',
        },
    });

    expect(agent.root).toEqual(expectedStack);
    expect(agent.status).toBe('running');

    let serialized = serializeAgent(agent);
    let json = JSON.stringify(serialized);
    let deserialized = deserializeAgent(JSON.parse(json) as AgentSerialized, agent.def);

    expect(deserialized).toMatchObject(agent);
    expect(deserialized.root).toEqual(expectedStack);
    expect(deserialized.status).toBe('running');

    agent = deserialized;

    await executeAgent({ agent });

    expectedStack = rootFrame({
        status: 'finished',
        children: [
            // var frame
            childFrame({
                status: 'finished',
                trace: '0:0',
                children: [
                    // tool call frame
                    childFrame({
                        status: 'finished',
                        trace: '0:0:0',
                        value: 'foo',
                        children: [
                            // tool param
                            childFrame({
                                status: 'finished',
                                trace: '0:0:0:0',
                                value: 'foo',
                            }),
                        ],
                    }),
                ],
            }),
            // var frame
            childFrame({
                status: 'finished',
                trace: '0:1',
                children: [
                    // tool call frame
                    childFrame({
                        status: 'finished',
                        trace: '0:1:0',
                        value: 'bar',
                        children: [
                            // tool param
                            childFrame({
                                status: 'finished',
                                trace: '0:1:0:0',
                                value: 'bar',
                            }),
                        ],
                    }),
                ],
            }),
            // var frame
            childFrame({
                status: 'finished',
                trace: '0:2',
                children: [
                    // tool call frame
                    childFrame({
                        status: 'finished',
                        trace: '0:2:0',
                        value: 'foobar',
                        children: [
                            // tool param - concat
                            childFrame({
                                status: 'finished',
                                trace: '0:2:0:0',
                                value: 'foobar',
                                children: [
                                    // concat left
                                    childFrame({
                                        status: 'finished',
                                        trace: '0:2:0:0:0',
                                        value: 'foo',
                                    }),
                                    // concat right
                                    childFrame({
                                        status: 'finished',
                                        trace: '0:2:0:0:1',
                                        value: 'bar',
                                    }),
                                ],
                            }),
                        ],
                    }),
                ],
            }),
        ],
        variables: {
            foo: 'foo',
            bar: 'bar',
            baz: 'foobar',
        },
    });

    expect(agent.root).toMatchObject(expectedStack);
    expect(agent.status).toBe('finished');

    serialized = serializeAgent(agent);
    json = JSON.stringify(serialized);
    deserialized = deserializeAgent(JSON.parse(json) as AgentSerialized, agent.def);

    expect(deserialized).toMatchObject(agent);
    expect(deserialized.root).toMatchObject(expectedStack);
    expect(deserialized.status).toBe('finished');
});
