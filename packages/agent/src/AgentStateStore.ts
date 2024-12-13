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
            getStateOrCreateByChatId(chatId: string) {
                let state = stateByChatId.get(chatId);
                if (!state) {
                    state = {
                        id: chatId,
                        chatId,
                        events: [],
                    };

                    stateByChatId.set(chatId, state);
                }

                return Promise.resolve(state);
            },
            updateState(state: AgentState) {
                const chatIds = new Set<string>();
                for (const interaction of state.events) {
                    if ('message' in interaction) {
                        const chatId = interaction.message?.chatId;
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
