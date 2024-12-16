import type { AgentState } from '@chorus/core';
import { defineService } from '@nzyme/ioc';

export const AgentStateStore = defineService({
    name: 'AgentStateStore',
    setup() {
        const stateById = new Map<string, AgentState>();
        const stateByChatId = new Map<string, AgentState>();

        return {
            getState(id: string) {
                return Promise.resolve(stateById.get(id));
            },
            getStateForChat(channelId: string, threadId: string) {
                const id = `${channelId}:${threadId}`;
                let state = stateByChatId.get(id);
                if (!state) {
                    state = {
                        id,
                        channelId,
                        threadId,
                        events: [],
                        tools: {},
                        users: {},
                    };

                    stateById.set(state.id, state);
                    stateByChatId.set(id, state);
                }

                return Promise.resolve(state);
            },
            updateState(state: AgentState) {
                const chatIds = new Set<string>();
                for (const interaction of state.events) {
                    if ('message' in interaction && interaction.message) {
                        const chatId = `${interaction.message.channelId}:${interaction.message.threadId}`;
                        if (chatId) {
                            chatIds.add(chatId);
                        }
                    }
                }

                stateById.set(state.id, state);
                for (const chatId of chatIds) {
                    stateByChatId.set(chatId, state);
                }
            },
        };
    },
});
