import createDebug from 'debug';

import { getCurrentDatePrompt } from '@agentscript.ai/utils';

import type { Runtime } from './defineRuntime.js';
import type { LanguageModel } from './llm/LanguageModel.js';
import { renderRuntime } from './modules/renderRuntime.js';
import { parseScript } from './parser/parseScript.js';
import { type Workflow, createWorkflow } from './runtime/createWorkflow.js';
import { createTypedPrompt } from './utils/createTypedPrompt.js';

/**
 * Parameters for {@link inferWorkflow}.
 */
export interface InferWorkflowParams<TRuntime extends Runtime = Runtime> {
    /**
     * AgentScript runtime to use.
     */
    runtime: TRuntime;

    /**
     * Language model to use.
     */
    llm: LanguageModel;

    /**
     * Prompt to infer the workflow from.
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
- can only use \`if\` statements to control execution flow
- some of the functions may require use interaction or approval to be executed, this is done in a chat in form of interactive messages, do not ask for approval here
- each function call or code block requires a comment briefly explaining the step

First explain your plan step by step in non-technical way. Do not reference code, or functions.
Then create a valid AgentScript code. 
Don't wrap code in a function.
Don't explain the code later.`;

const RESPONSE_REGEX = /^([\s\S]*)```(\w*)?\n([\s\S]*)\n```/m;

const debug = createDebug('agentscript:inferWorkflow');

/**
 * Infer a workflow from a given prompt.
 * @param params - Parameters for {@link inferWorkflow}.
 * @returns Inferred workflow.
 */
export async function inferWorkflow<TRuntime extends Runtime>(
    params: InferWorkflowParams<TRuntime>,
): Promise<Workflow<TRuntime>> {
    const definitions = renderRuntime(params.runtime);

    const systemPrompt = createTypedPrompt({
        prompts: [params.systemPrompt, SYSTEM_PROMPT, getCurrentDatePrompt()],
        definitions,
    });

    const response = await params.llm.invoke({
        systemPrompt,
        messages: [{ role: 'user', content: params.prompt }],
    });

    const { plan, code } = parseResponse(response.content);

    debug('plan', plan);
    debug('code', code);

    const ast = parseScript(code);
    const workflow = createWorkflow({
        runtime: params.runtime,
        ast,
        code,
        plan,
    });

    return workflow;
}

function parseResponse(response: string) {
    const match = response.match(RESPONSE_REGEX);
    if (!match) {
        throw new Error('No code found in response');
    }

    return {
        plan: match[1].trim(),
        code: match[3].trim(),
    };
}
