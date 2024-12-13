import { AIMessage, HumanMessage, SystemMessage } from '@langchain/core/messages';

import type { AgentEvent } from '@chorus/core';

export function convertEventToPrompt(event: AgentEvent) {
    switch (event.type) {
        case 'HUMAN_MESSAGE':
            return new HumanMessage(event.content);

        case 'AGENT_MESSAGE':
            return new AIMessage(event.content);

        case 'TOOL_EVENT':
            if (!event.content) {
                break;
            }

            return new SystemMessage({
                content: event.content,
            });
    }
}
