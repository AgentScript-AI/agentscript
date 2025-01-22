/**
 * Join lines into a single string.
 * @param lines - Lines to join.
 * @returns Joined lines.
 */
export function joinLines(lines: string | string[] | undefined | null) {
    if (!lines) {
        return '';
    }

    return Array.isArray(lines) ? lines.join('\n') : lines;
}
