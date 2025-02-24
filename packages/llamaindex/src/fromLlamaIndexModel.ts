import { LanguageModel, LanguageModelInvokeParams } from '@agentscript-ai/provider';
import { LLM, MessageContent } from '@llamaindex/core/llms';

export function fromLlamaIndexModel(model: LLM): LanguageModel {
    return {
        name: model.metadata.model,
        invoke: async (params: LanguageModelInvokeParams) => {
            const response = await model.chat({
                messages: params.messages,
            });

            return {
                role: 'assistant',
                content: parseMessageContent(response.message.content),
            };
        },
    };
}

function parseMessageContent(content: MessageContent): string {
    if (typeof content === 'string') {
        return content;
    }

    let text = '';

    for (const detail of content) {
        if (detail.type !== 'text') {
            throw new Error(`Unsupported message content type: ${detail.type}`);
        }

        text += detail.text;
    }

    return text;
}
