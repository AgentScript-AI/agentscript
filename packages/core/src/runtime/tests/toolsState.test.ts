import { expect, test } from 'vitest';

import { parseScript } from '@agentscript-ai/parser';
import * as s from '@agentscript-ai/schema';

import { createAgent } from '../../agent/createAgent.js';
import { defineTool } from '../../tools/defineTool.js';
import { executeAgent } from '../executeAgent.js';
import { agentResult, completedFrame, rootFrame } from './testUtils.js';

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
        status: 'done',
        children: [
            completedFrame({
                node: 'call',
                value: undefined,
                state: {
                    bar: 'foobar',
                },
            }),
        ],
    });

    expect(result).toEqual(agentResult({ ticks: 0 }));
    expect(agent.root).toEqual(expectedStack);
    expect(agent.status).toBe('done');
});
