export function createScript() {
    const lines: string[] = [];

    return {
        addCode,
        getCode,
    };

    function addCode(code: string | string[]) {
        if (typeof code === 'string') {
            lines.push(code);
        } else {
            lines.push(...code);
        }
    }

    function getCode() {
        return lines.join('\n');
    }
}
