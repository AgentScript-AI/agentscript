import { defineService } from '@nzyme/ioc';
import { SlackClient } from './SlackClient.js';

export interface SlackUser {
    id: string;
    name?: string;
    email?: string;
    description?: string;
}

export const SlackUsers = defineService({
    name: 'SlackUsers',
    setup({ inject }) {
        const slack = inject(SlackClient);
        const users = new Map<string, SlackUser>();

        return {
            getUser,
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
                name: response.user.real_name || response.user.name,
                email: response.user.profile?.email,
                description: response.user.profile?.title,
            };

            users.set(user.id, user);

            return user;
        }
    },
});
