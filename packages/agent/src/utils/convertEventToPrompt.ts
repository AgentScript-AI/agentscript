import { AIMessage, HumanMessage, SystemMessage } from '@langchain/core/messages';

import type { AgentEvent } from '@agentscript.ai/core';

export function convertEventToPrompt(event: AgentEvent) {
    switch (event.type) {
        case 'HUMAN_MESSAGE':
            return new HumanMessage({
                content: event.content,
                name: event.message.userId,
            });

        case 'AGENT_MESSAGE':
            return new AIMessage({
                content: event.content,
                name: event.message?.userId,
            });

        case 'TOOL_EVENT':
            if (!event.content) {
                break;
            }

            return new SystemMessage({
                content: event.content,
            });
    }
}
