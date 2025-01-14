import type { EmptyObject } from '@nzyme/types';
import createDebug from 'debug';

import { createTypedPrompt } from '@agentscript-ai/utils';

import type { LanguageModel } from '../LanguageModel.js';
import { createAgentInternal } from './createAgentInternal.js';
import type {
    AgentDefinition,
    AgentInputBase,
    AgentOutputBase,
    AgentTools,
} from './defineAgent.js';
import { renderRuntime } from '../modules/renderRuntime.js';
import { parseCodeResponse } from '../parser/parseCodeResponse.js';
import { parseScript } from '../parser/parseScript.js';

/**
 * Parameters for {@link inferAgent}.
 */
export interface InferAgentParams<
    TTools extends AgentTools,
    TInput extends AgentInputBase,
    TOutput extends AgentOutputBase,
> extends AgentDefinition<TTools, TInput, TOutput> {
    /**
     * ID of the agent.
     * If not provided, it will be generated as a UUID.
     */
    id?: string;
    /**
     * Language model to use.
     */
    llm: LanguageModel;
    /**
     * Prompt to infer the agent from.
     */
    prompt: string;
    /**
     * System prompt to use.
     */
    systemPrompt?: string;
}

const SYSTEM_PROMPT = `You answer using programming language called AgentScript. It's a subset of JavaScript with following limitations:
- can't use regexes
- can't use complex computation
- can only use predefined functions and nothing else
- to iterate over arrays always use \`map\` function
- each function call or code block requires a comment briefly explaining the step

First explain your plan step by step in non-technical way. Do not reference code, or functions.
Then create a valid AgentScript code. 
Don't wrap code in a function.
Don't explain the code later.`;

const debug = createDebug('agentscript:inferAgent');

/**
 * Infer an agent from a given prompt.
 * @param params - Parameters for {@link inferAgent}.
 * @returns Inferred agent.
 */
export async function inferAgent<
    TTools extends AgentTools,
    TInput extends AgentInputBase = EmptyObject,
    TOutput extends AgentOutputBase = undefined,
>(params: InferAgentParams<TTools, TInput, TOutput>) {
    const runtime = renderRuntime(params);

    const systemPrompt = createTypedPrompt({
        prompts: [params.systemPrompt, SYSTEM_PROMPT],
        definitions: runtime.code,
    });

    const response = await params.llm.invoke({
        systemPrompt,
        messages: [{ role: 'user', content: params.prompt }],
    });

    const { plan, code } = parseCodeResponse(response.content);

    debug('plan', plan);
    debug('code', code);

    const script = parseScript(code);
    const agent = createAgentInternal<TTools, TInput, TOutput>({
        id: params.id,
        tools: params.tools,
        input: params.input,
        output: params.output,
        script,
        plan,
        runtime,
    });

    return agent;
}
