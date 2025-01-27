import { validate } from 'uuid';
import { expect, test } from 'vitest';

import { parseScript } from '@agentscript-ai/parser';

import { createAgent } from './createAgent.js';

test('create agent with id', () => {
    const script = parseScript('foo()');

    const agent = createAgent({
        id: 'test',
        tools: {},
        script,
    });

    expect(agent.id).toBe('test');
});

test('create agent without id', () => {
    const script = parseScript('foo()');

    const agent = createAgent({ tools: {}, script });

    expect(validate(agent.id)).toBe(true);
});
