import * as z from 'zod';

import { INDENT } from '../constants.js';
import { type FunctionDefinition, isFunction } from '../defineFunction.js';
import { renderFunction } from './renderFunction.js';
import { renderType } from './renderType.js';
import { createTypeResolver } from './typeResolver.js';

export type Module = {
    [name: string]: z.ZodTypeAny | FunctionDefinition | Module;
};

const VALID_NAME_REGEX = /^[a-zA-Z_][a-zA-Z_0-9]*$/;

export function renderModule(module: Module, indent: string = '') {
    // todo: check if name is valid

    const typeResolver = createTypeResolver();

    for (const [key, value] of Object.entries(module)) {
        if (!VALID_NAME_REGEX.test(key)) {
            throw new Error(
                `Invalid name: ${key}. Names must start with a letter or underscore and can only contain letters, numbers, and underscores.`,
            );
        }

        if (value instanceof z.ZodObject) {
            typeResolver.add(key, value as z.AnyZodObject);
        }
    }

    let code = '';

    for (const [key, value] of Object.entries(module)) {
        if (code.length > 0) {
            code += '\n\n';
        }

        if (value instanceof z.ZodObject) {
            code += `${indent}export interface ${key} ${renderType(value as z.ZodTypeAny, {
                typeResolver,
                indent,
                noResolve: true,
            })}`;
        } else if (value instanceof z.ZodType) {
            // todo: support more types
            continue;
        } else if (isFunction(value)) {
            code += renderFunction({
                name: key,
                func: value,
                indent,
                typeResolver,
            });
        } else if (typeof value === 'object' && value !== null) {
            code += `${indent}declare namespace ${key} {\n`;
            code += renderModule(value, indent + INDENT);
            code += `\n${indent}}`;
        }
    }

    return code;
}
