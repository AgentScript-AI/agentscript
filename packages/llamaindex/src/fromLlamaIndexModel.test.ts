import { expect, test } from 'vitest';

import { OpenAI } from '@llamaindex/openai';
import { fromLlamaIndexModel } from './fromLlamaIndexModel.js';

test('llamaindex openai model', () => {
    const model = new OpenAI({
        model: 'gpt-4o',
    });

    const normalized = fromLlamaIndexModel(model);
    expect(normalized.name).toBe('gpt-4o');
});
