import { normalizeText } from '@agentscript-ai/utils';

/**
 * Render a directive.
 * @param directive - The directive to render.
 * @param comment - The comment to render.
 * @returns The rendered directive.
 */
export function renderDocDirective(directive: string, comment: string | string[]) {
    const normalized = normalizeText(comment);

    if (normalized.length === 0) {
        return '';
    }

    let result = `@${directive} ${normalized[0]}`;

    if (normalized.length > 1) {
        const indent = ' '.repeat(directive.length + 2);

        for (let i = 1; i < normalized.length; i++) {
            result += `\n${indent}${normalized[i]}`;
        }
    }

    return result;
}
