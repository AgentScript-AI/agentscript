import type { BaseMessage } from '@langchain/core/messages';
import { Annotation } from '@langchain/langgraph';

export const AgentStateAnnotation = Annotation.Root({
    messages: Annotation<BaseMessage[]>({
        reducer: (x, y) => x.concat(y),
    }),
    channelId: Annotation<string>({
        reducer: (x, y) => x ?? y,
    }),
});

export type AgentState = typeof AgentStateAnnotation.State;
