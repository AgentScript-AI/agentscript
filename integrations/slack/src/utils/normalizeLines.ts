export function normalizeLines(text: string[] | string | undefined | null) {
    if (text == null) {
        return [];
    }

    return Array.isArray(text) ? text : [text];
}
