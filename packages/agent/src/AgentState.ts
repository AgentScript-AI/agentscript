import type { Document } from '@langchain/core/documents';
import type { BaseMessage } from '@langchain/core/messages';
import { Annotation } from '@langchain/langgraph';

export const AgentStateAnnotation = Annotation.Root({
    messages: Annotation<BaseMessage[]>({
        reducer: (x, y) => x.concat(y),
    }),
    channelId: Annotation<string>({
        reducer: (x, y) => x ?? y,
    }),
    documents: Annotation<Document[]>({
        reducer: (x, y) => x.concat(y),
    }),
});

export interface AgentState {
    id: string;
    threadId: string;
    channelId: string;
    messages: BaseMessage[];
}

export type AgentStateUpdate = typeof AgentStateAnnotation.Update;
