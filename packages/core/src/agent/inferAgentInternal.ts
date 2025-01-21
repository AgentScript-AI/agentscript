import { codeSnippet } from '@nzyme/markdown';

import type { LanguageModel, LanguageModelMessage } from '../LanguageModel.js';
import type { AgentState } from './agentTypes.js';
import { createAgentInternal } from './createAgentInternal.js';
import type { AgentDefinition } from './defineAgent.js';
import { renderRuntime } from '../modules/renderRuntime.js';
import { parseCodeResponse } from '../parser/parseCodeResponse.js';
import { parseScript } from '../parser/parseScript.js';

interface InferAgentInternalOptions {
    def: AgentDefinition;
    id?: string;
    model: LanguageModel;
    systemPrompt?: string;
    chain?: AgentState[];
    messages?: LanguageModelMessage[];
    prompt: string;
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

/**
 * Infer an agent from a given prompt.
 * @param params - Parameters for {@link inferAgentInternal}.
 * @returns Inferred agent.
 */
export async function inferAgentInternal(params: InferAgentInternalOptions) {
    const runtime = renderRuntime(params.def);

    const basePrompt = params.systemPrompt ? `${params.systemPrompt}\n\n` : '';
    const systemPrompt = `${basePrompt}${SYSTEM_PROMPT}\n\n${codeSnippet(runtime.code, 'typescript')}`;

    const messages: LanguageModelMessage[] = [];
    if (params.messages) {
        messages.push(...params.messages);
    }

    messages.push({
        role: 'user',
        content: params.prompt,
    });

    const response = await params.model.invoke({
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
        prompt: params.prompt,
        script,
        plan,
        runtime,
    });

    return agent;
}
