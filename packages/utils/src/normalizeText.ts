/**
 * Normalize text to an array of strings, split into lines.
 *
 * @param text - The text to normalize.
 * @returns An array of strings.
 */
export function normalizeText(text: string | string[] | undefined | null) {
    if (!text) {
        return [];
    }

    if (!Array.isArray(text)) {
        return text.split('\n').map(line => line.trim());
    }

    const normalized: string[] = [];

    for (const line of text) {
        const lines = line.split('\n');

        for (const l of lines) {
            normalized.push(l.trim());
        }
    }

    return normalized;
}
