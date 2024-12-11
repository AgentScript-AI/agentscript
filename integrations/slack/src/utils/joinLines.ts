import type { SlackText } from '../types.js';

export function joinLines(text: SlackText) {
    return Array.isArray(text) ? text.filter(Boolean).join('\n') : text;
}
