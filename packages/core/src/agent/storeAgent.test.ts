import { expect, test } from 'vitest';

import * as s from '@agentscript-ai/schema';

import type { AgentSerialized } from './agentTypes.js';
import { createAgent } from './createAgent.js';
import { restoreAgent } from './restoreAgent.js';
import { storeAgent } from './storeAgent.js';
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
                node: 'any',
                status: 'finished',
                children: [
                    // tool call frame
                    childFrame({
                        node: 'any',
                        status: 'finished',
                        value: 'foo',
                    }),
                ],
            }),
        ],
        variables: {
            foo: 'foo',
        },
    });

    expect(agent.root).toMatchObject(expectedStack);
    expect(agent.status).toBe('running');

    let serialized = storeAgent(agent);
    let json = JSON.stringify(serialized);
    let deserialized = restoreAgent(JSON.parse(json) as AgentSerialized, agent.def);

    expect(deserialized.root).toMatchObject(expectedStack);
    expect(deserialized.status).toBe('running');

    agent = deserialized;

    await executeAgent({ agent });

    expectedStack = rootFrame({
        status: 'finished',
        children: [
            // var frame
            childFrame({
                node: 'any',
                status: 'finished',
                children: [
                    // tool call frame
                    childFrame({
                        node: 'any',
                        status: 'finished',
                        value: 'foo',
                    }),
                ],
            }),
            // var frame
            childFrame({
                node: 'any',
                status: 'finished',
                children: [
                    // tool call frame
                    childFrame({
                        node: 'any',
                        status: 'finished',
                        value: 'bar',
                    }),
                ],
            }),
            // var frame
            childFrame({
                node: 'any',
                status: 'finished',
                children: [
                    // tool call frame
                    childFrame({
                        node: 'any',
                        status: 'finished',
                        value: 'foobar',
                        children: [
                            // call object
                            null,
                            // tool param - concat
                            childFrame({
                                node: 'any',
                                status: 'finished',
                                value: 'foobar',
                                children: [
                                    // concat left
                                    childFrame({
                                        node: 'any',
                                        status: 'finished',
                                        value: 'foo',
                                    }),
                                    // concat right
                                    childFrame({
                                        node: 'any',
                                        status: 'finished',
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

    serialized = storeAgent(agent);
    json = JSON.stringify(serialized);
    deserialized = restoreAgent(JSON.parse(json) as AgentSerialized, agent.def);

    expect(deserialized.root).toMatchObject(expectedStack);
    expect(deserialized.status).toBe('finished');
});
