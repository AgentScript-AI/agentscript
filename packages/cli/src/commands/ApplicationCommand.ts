import { Command, Flags } from '@oclif/core';

import { createContainer } from '@nzyme/ioc';
import { Logger, PrettyLoggerFactory } from '@nzyme/logging';

export abstract class ApplicationCommand extends Command {
    public static override flags = {
        env: Flags.string({
            name: 'env',
            description: 'Stage to operate on',
        }),
    };

    protected readonly container = createContainer();

    override async init() {
        await super.init();

        this.container.set(Logger, PrettyLoggerFactory);
    }

    override async finally(e: Error | undefined) {
        await super.finally(e);
        if (e) {
            console.error(e);
        }
        process.exit();
    }
}
