type CreateTypedPromptParams = {
    prompts: (string | undefined | null)[];
    definitions: string;
};

/**
 * Create a prompt for a typed result.
 * @param params - Parameters for {@link createTypedPrompt}.
 * @returns Prompt for a typed result.
 */
export function createTypedPrompt(params: CreateTypedPromptParams) {
    const prompts = params.prompts.filter(Boolean).join('\n\n');

    return `${prompts}\n\n\`\`\`typescript\n${params.definitions}\n\`\`\``;
}
