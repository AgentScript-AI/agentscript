import { openai } from '@ai-sdk/openai';
import { ChatOpenAI } from '@langchain/openai';
import { expect, test } from 'vitest';

import { isLangChainModel } from './LangChainModel.js';
import type { LanguageModel } from './LanguageModel.js';
import { isVercelModel } from './VercelModel.js';
import { normalizeModel } from './normalizeModel.js';

test('normalize vercel model', () => {
    const model = openai('gpt-4o');
    const normalized = normalizeModel(model);

    expect(normalized.name).toBe('gpt-4o');
    expect(isVercelModel(normalized)).toBe(false);
    expect(isLangChainModel(normalized)).toBe(false);
});

test('normalize langchain model', () => {
    const model = new ChatOpenAI({ model: 'gpt-4o' });
    const normalized = normalizeModel(model);

    expect(normalized.name).toBe('gpt-4o');
    expect(isVercelModel(normalized)).toBe(false);
    expect(isLangChainModel(normalized)).toBe(false);
});

test('normalize native model', () => {
    const model: LanguageModel = {
        name: 'claude-3-5-sonnet-latest',
        invoke: () =>
            Promise.resolve({
                role: 'assistant',
                content: 'test',
            }),
    };
    const normalized = normalizeModel(model);

    expect(normalized).toBe(model);
    expect(isVercelModel(normalized)).toBe(false);
    expect(isLangChainModel(normalized)).toBe(false);
});
