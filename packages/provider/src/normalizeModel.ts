import { defineInterface } from '@nzyme/ioc';

import type { LangChainModel } from './LangChainModel.js';
import { isLangChainModel, normalizeLangChainModel } from './LangChainModel.js';
import type { LanguageModel } from './LanguageModel.js';
import type { VercelModel } from './VercelModel.js';
import { isVercelModel, normalizeVercelModel } from './VercelModel.js';

/**
 * Language model input.
 * You can pass any language model from Vercel AI SDK or LangChain.
 */
export type LanguageModelInput = VercelModel | LangChainModel | LanguageModel;

/**
 * Language model input injectable.
 */
export const LanguageModelInput = defineInterface<LanguageModelInput>({
    name: 'LanguageModelInput',
});

/**
 * Normalizes a language model.
 * @param model - Language model to normalize.
 * @returns Normalized language model.
 */
export function normalizeModel(model: LanguageModelInput): LanguageModel {
    if (isVercelModel(model)) {
        return normalizeVercelModel(model);
    }

    if (isLangChainModel(model)) {
        return normalizeLangChainModel(model);
    }

    if (isNativeModel(model)) {
        return model;
    }

    throw new Error('Invalid model');
}

function isNativeModel(model: LanguageModelInput): model is LanguageModel {
    return typeof model === 'object' && 'invoke' in model && model.name !== undefined;
}
