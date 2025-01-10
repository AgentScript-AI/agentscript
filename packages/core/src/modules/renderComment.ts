import type { RenderContext } from './renderContext.js';

/**
 * Render a comment.
 * @param comment - The comment to render.
 * @param ctx - Render context.
 * @returns Rendered comment.
 */
export function renderComment(comment: string[], ctx: RenderContext) {
    let code = '';

    if (comment.length === 0) {
        return;
    }

    if (comment.length > 1) {
        code = `${ctx.indent}/**`;
        for (const line of comment) {
            code += `\n${ctx.indent} * ${line}`;
        }
        code += `\n${ctx.indent} */`;
    } else {
        code = `${ctx.indent}/** ${comment[0]} */`;
    }

    return code;
}
