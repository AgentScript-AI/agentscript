import { anthropic } from '@ai-sdk/anthropic';
import { openai } from '@ai-sdk/openai';
import { ChatAnthropic } from '@langchain/anthropic';
import { ChatOpenAI } from '@langchain/openai';
import { expect, test } from 'vitest';

import { isLangChainModel, normalizeLangChainModel } from './LangChainModel.js';
import type { LanguageModel } from './LanguageModel.js';

test('langchain openai model', () => {
    const model = new ChatOpenAI({ model: 'gpt-4o' });
    const check = isLangChainModel(model);

    expect(check).toBe(true);

    const normalized = normalizeLangChainModel(model);

    expect(normalized.name).toBe('gpt-4o');
    expect(isLangChainModel(normalized)).toBe(false);
});

test('langchain anthropic model', () => {
    const model = new ChatAnthropic({
        modelName: 'claude-3-5-sonnet-latest',
        apiKey: 'test',
    });
    const check = isLangChainModel(model);

    expect(check).toBe(true);

    const normalized = normalizeLangChainModel(model);

    expect(normalized.name).toBe('claude-3-5-sonnet-latest');
    expect(isLangChainModel(normalized)).toBe(false);
});

test('vercel openai model', () => {
    const model = openai('gpt-4o');
    const check = isLangChainModel(model);

    expect(check).toBe(false);
});

test('vercel anthropic model', () => {
    const model = anthropic('claude-3-5-sonnet-latest');
    const check = isLangChainModel(model);

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

    expect(isLangChainModel(model)).toBe(false);
});
