import { openai } from '@ai-sdk/openai';
import { ChatOpenAI } from '@langchain/openai';
import { expect, test } from 'vitest';

import { isVercelModel, normalizeVercelModel } from './VercelModel.js';

test('vercel openai model', () => {
    const model = openai('gpt-4o');
    const check = isVercelModel(model);

    expect(check).toBe(true);

    const normalized = normalizeVercelModel(model);
    expect(isVercelModel(normalized)).toBe(false);
});

test('langchain openai model', () => {
    const model = new ChatOpenAI({ model: 'gpt-4o' });
    const check = isVercelModel(model);

    expect(check).toBe(false);
});
