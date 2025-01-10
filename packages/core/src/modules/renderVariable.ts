import type * as s from '@agentscript-ai/schema';
import { normalizeText } from '@agentscript-ai/utils';

import { renderComment } from './renderComment.js';
import type { RenderContext } from './renderContext.js';
import { renderType } from './renderType.js';

/**
 * Parameters for {@link renderVariable}.
 */
export interface RenderVariableParams {
    /**
     * Render context.
     */
    ctx: RenderContext;
    /**
     * Name of the variable.
     */
    name: string;
    /**
     * Type of the variable.
     */
    type: s.Schema;
    /**
     * Description of the variable.
     */
    description?: string | string[];
    /**
     * Whether the variable is constant.
     */
    const?: boolean;
}

/**
 * Render a variable as TypeScript code.
 * @param params - Parameters for {@link renderVariable}.
 */
export function renderVariable(params: RenderVariableParams) {
    const { name, type, const: isConst = false, ctx } = params;

    const description: string[] = [];

    if (params.description) {
        description.push(...normalizeText(params.description));
    }

    if (type.description) {
        description.push(...normalizeText(type.description));
    }

    const typeName = renderType({ schema: type, ctx });
    const comment = renderComment(description, ctx);

    ctx.addLine();

    if (comment) {
        ctx.addLine(comment);
    }

    ctx.addLine(`${isConst ? 'const' : 'let'} ${name}: ${typeName}`);
}
