export function renderComment(comment: string[], indent: string = '') {
    if (comment.length === 0) {
        return '';
    }

    if (comment.length > 1) {
        return `${indent}/**\n${comment.map(line => `${indent} * ${line}`).join('\n')}\n${indent} */`;
    }

    return `${indent}/** ${comment[0]} */`;
}
