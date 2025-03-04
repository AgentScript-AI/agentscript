import { codeSnippet } from '@nzyme/markdown';

import { parseCodeResponse, parseScript } from '@agentscript-ai/parser';
import {
    type LanguageModelInput,
    type LanguageModelMessage,
    normalizeModel,
} from '@agentscript-ai/provider';
import { joinLines } from '@agentscript-ai/utils';

import type { AgentState } from './agentTypes.js';
import { createAgentInternal } from './createAgentInternal.js';
import type { AgentDefinition } from './defineAgent.js';
import { renderRuntime } from '../modules/renderRuntime.js';

interface InferAgentInternalOptions {
    def: AgentDefinition;
    id?: string;
    model: LanguageModelInput;
    systemPrompt?: string | string[];
    chain?: AgentState[];
    messages?: LanguageModelMessage[];
    prompt: string | string[];
}

const SYSTEM_PROMPT = `You answer using programming language called AgentScript. It's a subset of JavaScript with following limitations:
- can only use predefined functions and basic JavaScript built-ins
- DO NOT define your own functions
- DO NOT define arrow functions as variables
- DO NOT use try/catch
- to iterate over arrays ALWAYS use \`array.map()\` function
- NEVER assume array in non-empty
- each function call or code block requires a comment briefly explaining the step

First explain your plan step by step in non-technical way. Do not reference code, or functions.
Then create a valid AgentScript code. 
Don't wrap code in a function.
Don't explain the code later.`;

/**
 * Infer an agent from a given prompt.
 * @param params - Parameters for {@link inferAgentInternal}.
 * @returns Inferred agent.
 */
export async function inferAgentInternal(params: InferAgentInternalOptions) {
    const model = normalizeModel(params.model);
    const runtime = renderRuntime(params.def);

    const basePrompt = joinLines(params.systemPrompt);
    const systemPrompt = [
        //
        basePrompt,
        SYSTEM_PROMPT,
        codeSnippet(runtime.code, 'typescript'),
    ]
        .filter(Boolean)
        .join('\n\n');

    const prompt = joinLines(params.prompt);

    const messages: LanguageModelMessage[] = [];
    if (params.messages) {
        messages.push(...params.messages);
    }

    messages.push({
        role: 'user',
        content: prompt,
    });

    const response = await model.invoke({
        systemPrompt,
        messages,
    });

    const { plan, code } = parseCodeResponse(response.content);

    const script = parseScript(code);
    const agent = createAgentInternal({
        id: params.id,
        tools: params.def.tools,
        input: params.def.input,
        output: params.def.output,
        chain: params.chain,
        prompt,
        script,
        plan,
        runtime,
    });

    return agent;
}
