import { expect, test } from 'vitest';

import * as s from '@agentscript-ai/schema';

import { defineTool } from '../../defineTool.js';
import { parseScript } from '../../parser/parseScript.js';
import { createAgent } from '../createAgent.js';
import { executeAgent } from '../executeAgent.js';
import { agentResult, anyDate, completedFrame, rootFrame } from './testUtils.js';

test('simple tool state', async () => {
    const tool = defineTool({
        description: 'A tool',
        input: {
            foo: s.string(),
        },
        state: {
            bar: s.string(),
        },
        handler: ({ input, state }) => {
            state.bar = input.foo + 'bar';
        },
    });

    const tools = {
        tool,
    };

    const script = parseScript([
        //
        'tool("foo");',
    ]);

    const agent = createAgent({ tools, script });

    const result = await executeAgent({ agent });
    const expectedStack = rootFrame({
        completedAt: anyDate(),
        children: [
            completedFrame({
                value: undefined,
                state: {
                    bar: 'foobar',
                },
                children: [completedFrame({ value: 'foo' })],
            }),
        ],
    });

    expect(result).toEqual(agentResult({ ticks: 0, done: true }));
    expect(agent.state?.root).toEqual(expectedStack);
    expect(agent.state?.complete).toBe(true);
});
