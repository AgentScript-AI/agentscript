import { anthropic } from '@ai-sdk/anthropic';
import { openai } from '@ai-sdk/openai';
import { ChatAnthropic } from '@langchain/anthropic';
import { ChatOpenAI } from '@langchain/openai';
import { expect, test } from 'vitest';

import type { LanguageModel } from './LanguageModel.js';
import { isVercelModel, normalizeVercelModel } from './VercelModel.js';

test('vercel openai model', () => {
    const model = openai('gpt-4o');
    const check = isVercelModel(model);

    expect(check).toBe(true);

    const normalized = normalizeVercelModel(model);
    expect(normalized.name).toBe('gpt-4o');
    expect(isVercelModel(normalized)).toBe(false);
});

test('vercel anthropic model', () => {
    const model = anthropic('claude-3-5-sonnet-latest');
    const check = isVercelModel(model);

    expect(check).toBe(true);

    const normalized = normalizeVercelModel(model);
    expect(normalized.name).toBe('claude-3-5-sonnet-latest');
    expect(isVercelModel(normalized)).toBe(false);
});

test('langchain openai model', () => {
    const model = new ChatOpenAI({ model: 'gpt-4o' });
    const check = isVercelModel(model);

    expect(check).toBe(false);
});

test('langchain anthropic model', () => {
    const model = new ChatAnthropic({
        modelName: 'claude-3-5-sonnet-latest',
        apiKey: 'test',
    });
    const check = isVercelModel(model);

    expect(check).toBe(false);
});

test('native model', () => {
    const model: LanguageModel = {
        name: 'gpt-4o',
        invoke: () =>
            Promise.resolve({
                role: 'assistant',
                content: 'Hello, world!',
            }),
    };

    expect(isVercelModel(model)).toBe(false);
});
