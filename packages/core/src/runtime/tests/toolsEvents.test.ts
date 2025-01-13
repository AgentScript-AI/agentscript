import { expect, test } from 'vitest';

import * as s from '@agentscript-ai/schema';

import { parseScript } from '../../parser/parseScript.js';
import { defineTool } from '../../tools/defineTool.js';
import { createAgent } from '../createAgent.js';
import { executeAgent } from '../executeAgent.js';
import { anyDate, childFrame, completedFrame, rootFrame } from './testUtils.js';
import { pushEvent } from '../pushEvent.js';

test('simple tool event', async () => {
    const tool = defineTool({
        input: {
            foo: s.string(),
        },
        output: s.string(),
        event: s.string(),
        handler: ({ input, events, result }) => {
            if (events.length > 0) {
                expect(events.length).toBe(1);
                expect(events[0].payload).toBe('bar');
                expect(events[0].processed).toBe(false);

                events[0].processed = true;
                return input.foo + events[0].payload;
            }

            return result.await();
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

    await executeAgent({ agent });

    let expectedStack = rootFrame({
        status: 'awaiting',
        children: [
            childFrame({
                status: 'awaiting',
                trace: '0:0',
                children: [
                    completedFrame({
                        trace: '0:0:0',
                        value: 'foo',
                    }),
                ],
            }),
        ],
    });

    expect(agent.root).toEqual(expectedStack);
    expect(agent.status).toBe('awaiting');

    pushEvent({
        agent,
        trace: '0:0',
        event: 'bar',
    });

    expectedStack = rootFrame({
        status: 'awaiting',
        children: [
            childFrame({
                status: 'awaiting',
                trace: '0:0',
                events: [
                    {
                        timestamp: anyDate(),
                        payload: 'bar',
                        processed: false,
                    },
                ],
                children: [
                    completedFrame({
                        trace: '0:0:0',
                        value: 'foo',
                    }),
                ],
            }),
        ],
    });

    expect(agent.root).toEqual(expectedStack);
    expect(agent.status).toBe('awaiting');

    await executeAgent({ agent });

    expectedStack = rootFrame({
        status: 'finished',
        children: [
            completedFrame({
                trace: '0:0',
                value: 'foobar',

                events: [
                    {
                        timestamp: anyDate(),
                        payload: 'bar',
                        processed: true,
                    },
                ],
                children: [
                    completedFrame({
                        trace: '0:0:0',
                        value: 'foo',
                    }),
                ],
            }),
        ],
    });

    expect(agent.root).toEqual(expectedStack);
    expect(agent.status).toBe('finished');
});
