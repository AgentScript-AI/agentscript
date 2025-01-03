import type { ChatUser } from '@agentscript-ai/core';
import { defineService } from '@nzyme/ioc';

import { SlackClient } from './SlackClient.js';

export const SlackUsers = defineService({
    name: 'SlackUsers',
    deps: {
        slack: SlackClient,
    },
    setup({ slack }) {
        const users = new Map<string, ChatUser>();
        let self: Promise<ChatUser> | undefined;

        return {
            getUser,
            getSelfUser,
        };

        async function getUser(id: string) {
            let user = users.get(id);
            if (user) {
                return user;
            }

            const response = await slack.users.info({ user: id });
            if (!response.user) {
                throw new Error(`User ${id} not found`);
            }

            user = {
                id: id,
                type: response.user.is_bot ? 'BOT' : 'HUMAN',
                name: response.user.real_name || response.user.name || id,
                email: response.user.profile?.email,
                description: response.user.profile?.title || undefined,
            };

            users.set(user.id, user);

            return user;
        }

        async function getSelfUser() {
            if (self) {
                return await self;
            }

            const response = await slack.auth.test();
            console.log(response);
            if (!response.user_id) {
                throw new Error('Failed to get self user');
            }

            self = getUser(response.user_id);
            return await self;
        }
    },
});
