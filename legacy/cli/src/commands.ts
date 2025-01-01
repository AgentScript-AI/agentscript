import { NotionSyncCommand } from './commands/NotionSyncCommand.js';
import { StartCommand } from './commands/StartCommand.js';

export default {
    start: StartCommand,
    'notion:sync': NotionSyncCommand,
};
