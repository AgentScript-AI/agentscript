import { SystemMessage } from '@langchain/core/messages';

export function defineSystemPrompt(prompt: string[]) {
    return new SystemMessage(prompt.join('\n'));
}
