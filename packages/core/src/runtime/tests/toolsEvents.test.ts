import { expect, test } from 'vitest';

import * as s from '@agentscript-ai/schema';

import { parseScript } from '../../parser/parseScript.js';
import { defineTool } from '../../tools/defineTool.js';
import { createAgent } from '../createAgent.js';
import { executeAgent } from '../executeAgent.js';
import { agentResult, completedFrame, rootFrame } from './testUtils.js';

test('simple tool event', async () => {
    const tool = defineTool({
        input: {
            foo: s.string(),
        },
        state: {
            bar: s.string({ optional: true }),
        },
        event: s.string(),
        handler: ({ input, state, events }) => {},
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
        status: 'finished',
        children: [
            completedFrame({
                trace: '0:0',
                value: undefined,
                state: {
                    bar: 'foobar',
                },
                children: [
                    completedFrame({
                        trace: '0:0:0',
                        value: 'foo',
                    }),
                ],
            }),
        ],
    });

    expect(result).toEqual(agentResult({ ticks: 0, done: true }));
    expect(agent.state?.root).toEqual(expectedStack);
    expect(agent.state?.complete).toBe(true);
});
