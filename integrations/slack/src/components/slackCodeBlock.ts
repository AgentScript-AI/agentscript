import { joinLines } from '../utils/joinLines.js';
import { normalizeLines } from '../utils/normalizeLines.js';

export function slackCodeBlock(text: string | string[]): string {
    return joinLines(['```', ...normalizeLines(text), '```']);
}
