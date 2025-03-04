import type { LanguageModelInput } from '@agentscript-ai/provider';
import { normalizeModel } from '@agentscript-ai/provider';
import { joinLines } from '@agentscript-ai/utils';

import { isTool } from './defineTool.js';
import { filterTools } from './filterTools.js';
import type { RuntimeModule } from '../agent/defineAgent.js';

/**
 * Refine tools options.
 */
export interface RefineToolsOptions {
    /**
     * Tools to refine.
     */
    tools: RuntimeModule;
    /**
     * Language model to use.
     */
    model: LanguageModelInput;
    /**
     * Prompt to use.
     */
    prompt: string;
    /**
     * System prompt to use.
     */
    systemPrompt?: string | string[];
}

const SYSTEM_PROMPT = `
You are given a set of tools and a prompt.
You need to narrow down the set of tools to only include the ones that may be needed to answer the prompt.
If you are not sure, include the tool.

Tools are defined in the following JSON format:
{
    "toolName1": "toolDescription1",
    "toolName2": "toolDescription2",
    ...
}

You need to return only tool names, each on a new line, nothing else.
`;

/**
 * Uses LLM to narrow down the set of tools to only include the ones that are needed.
 * @param options - Refine tools options.
 * @returns Refined tools.
 */
export async function refineTools(options: RefineToolsOptions): Promise<RuntimeModule> {
    const model = normalizeModel(options.model);

    const tools: Record<string, string> = {};
    populateToolPrompt(options.tools, tools, '');

    let systemPrompt = SYSTEM_PROMPT;
    if (options.systemPrompt) {
        systemPrompt = `${systemPrompt}\n\n${joinLines(options.systemPrompt)}`;
    }

    systemPrompt = `${systemPrompt}\n\n<TOOLS>\n${JSON.stringify(tools)}\n</TOOLS>`;

    const response = await model.invoke({
        messages: [
            {
                role: 'user',
                content: options.prompt,
            },
        ],
        systemPrompt,
    });

    const toolNames = response.content.split('\n').map(line => line.trim());

    return filterTools(options.tools, toolNames);
}

function populateToolPrompt(tools: RuntimeModule, result: Record<string, string>, prefix: string) {
    for (const [name, value] of Object.entries(tools)) {
        const fullName = prefix ? `${prefix}.${name}` : name;
        if (isTool(value)) {
            result[fullName] = joinLines(value.description);
        } else {
            populateToolPrompt(value, result, fullName);
        }
    }
}
