import type { AppMentionEvent, BotMessageEvent, GenericMessageEvent } from '@slack/types';

import { blocksToMarkdown } from '@nzyme/slack';
import { mapNotNull } from '@nzyme/utils';

export function stringifyMessage(message: GenericMessageEvent | AppMentionEvent | BotMessageEvent) {
    let content = '';

    if (message.blocks) {
        content = blocksToMarkdown(message.blocks);
    }

    if (!content && message.text) {
        content = message.text;
    }

    if ('files' in message && message.files) {
        content = appendNewline(content);
        content += 'Attached files:\n';

        const files = mapNotNull(message.files, file => {
            if (isFile(file)) {
                return {
                    name: file.name,
                    url: file.url_private,
                };
            }

            return null;
        });

        content += JSON.stringify(files);

        // for (const file of message.files) {
        //     if (!isFile(file)) {
        //         continue;
        //     }

        //     content = appendNewline(content);

        //     // if (file.mimetype.startsWith('image/')) {
        //     //     content += `![${file.name}](${
        //     //         file.thumb_1024 ||
        //     //         file.thumb_960 ||
        //     //         file.thumb_720 ||
        //     //         file.thumb_480 ||
        //     //         file.thumb_360 ||
        //     //         file.permalink_public ||
        //     //         file.permalink
        //     //     })`;
        //     // } else {
        //     content += `[${file.name}](${file.permalink_public || file.permalink})`;
        //     // }
        // }
    }

    return content;
}

type File = NonNullable<GenericMessageEvent['files']>[number];

function appendNewline(content: string) {
    if (content.length > 0) {
        return content + '\n';
    }

    return content;
}

function isFile(file: File | { id: string }): file is File {
    return 'mimetype' in file;
}
