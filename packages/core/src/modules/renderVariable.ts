import type * as s from '@agentscript-ai/schema';

import { renderComment } from './renderComment.js';
import { renderTypeInline } from './renderType.js';
import type { TypeResolver } from './typeResolver.js';
import { normalizeText } from '../utils/normalizeText.js';

/**
 * Parameters for {@link renderVariable}.
 */
export interface RenderVariableParams {
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
     * Indentation for the variable.
     */
    indent?: string;
    /**
     * Whether the variable is constant.
     */
    const?: boolean;

    /**
     * Type resolver to use.
     */
    typeResolver?: TypeResolver;
}

/**
 * Render a variable as TypeScript code.
 * @param params - Parameters for {@link renderVariable}.
 * @returns Rendered variable.
 */
export function renderVariable(params: RenderVariableParams) {
    const { name, type, indent = '', const: isConst = false, typeResolver } = params;

    let code = '';

    const description: string[] = [];

    if (params.description) {
        description.push(...normalizeText(params.description));
    }

    if (type.description) {
        description.push(...normalizeText(type.description));
    }

    if (description.length > 0) {
        code += `${renderComment(description, indent)}\n`;
    }

    code += `${indent}${isConst ? 'const' : 'let'} ${name}: `;

    const typeName = typeResolver?.getName(type);
    if (typeName) {
        code += typeName;
    } else {
        code += renderTypeInline(type, {
            indent,
            typeResolver,
        });
    }

    return code;
}
