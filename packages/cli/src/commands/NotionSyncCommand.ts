import { SyncNotionPages } from '@agentscript/notion';

import { ApplicationCommand } from './ApplicationCommand.js';

export class NotionSyncCommand extends ApplicationCommand {
    static override description = 'Sync Notion pages';

    async run() {
        const syncNotionPages = this.container.resolve(SyncNotionPages);
        await syncNotionPages();
    }
}
