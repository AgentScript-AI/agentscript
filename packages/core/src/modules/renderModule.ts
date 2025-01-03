import * as s from '@agentscript.ai/schema';

import { INDENT } from '../constants.js';
import { isTool } from '../defineTool.js';
import { renderTool } from './renderTool.js';
import { renderTypeNamed } from './renderType.js';
import { createTypeResolver } from './typeResolver.js';
import type { RuntimeModule } from '../defineRuntime.js';

const VALID_NAME_REGEX = /^[a-zA-Z_][a-zA-Z_0-9]*$/;

/**
 * Render a runtime module as TypeScript code.
 * @param module - Runtime module to render.
 * @param indent - Indentation to use.
 * @returns Rendered module.
 */
export function renderModule(module: RuntimeModule, indent: string = '') {
    const typeResolver = createTypeResolver();

    for (const [key, value] of Object.entries(module)) {
        if (!VALID_NAME_REGEX.test(key)) {
            throw new Error(
                `Invalid name: ${key}. Names must start with a letter or underscore and can only contain letters, numbers, and underscores.`,
            );
        }

        if (s.isSchema(value, s.object)) {
            typeResolver.add(key, value as s.ObjectSchema);
        }
    }

    let code = '';

    for (const [name, value] of Object.entries(module)) {
        if (code.length > 0) {
            code += '\n\n';
        }

        if (s.isSchema(value)) {
            if (value.base === s.object) {
                code += renderTypeNamed(value, {
                    name,
                    indent,
                    typeResolver,
                });

                // todo: support more types
            }
        } else if (isTool(value)) {
            code += renderTool({
                name,
                func: value,
                indent,
                typeResolver,
            });
        } else if (typeof value === 'object' && value !== null) {
            code += `${indent}declare namespace ${name} {\n`;
            code += renderModule(value, indent + INDENT);
            code += `\n${indent}}`;
        }
    }

    return code;
}
