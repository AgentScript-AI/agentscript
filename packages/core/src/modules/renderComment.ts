/**
 * Render a comment.
 * @param comment - The comment to render.
 * @param indent - The indent to use.
 * @returns The rendered comment.
 */
export function renderComment(comment: string | string[], indent: string = '') {
    if (typeof comment === 'string') {
        comment = [comment];
    }

    if (comment.length === 0) {
        return '';
    }

    if (comment.length > 1) {
        return `${indent}/**\n${comment.map(line => `${indent} * ${line}`).join('\n')}\n${indent} */`;
    }

    return `${indent}/** ${comment[0]} */`;
}
