import type { BaseMessage } from '@langchain/core/messages';

export interface AgentState {
    id: string;
    threadId: string;
    channelId: string;
    messages: BaseMessage[];
}
