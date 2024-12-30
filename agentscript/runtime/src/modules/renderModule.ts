import * as s from '@agentscript/schema';

import { INDENT } from '../constants.js';
import { type FunctionDefinition, isFunction } from '../defineFunction.js';
import { renderFunction } from './renderFunction.js';
import { renderType } from './renderType.js';
import { createTypeResolver } from './typeResolver.js';

export type Module = {
    [name: string]: s.Schema | FunctionDefinition | Module;
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

        if (s.isSchema(value, s.object)) {
            typeResolver.add(key, value as s.ObjectSchema);
        }
    }

    let code = '';

    for (const [key, value] of Object.entries(module)) {
        if (code.length > 0) {
            code += '\n\n';
        }

        if (s.isSchema(value)) {
            if (value.base === s.object) {
                code += `${indent}export interface ${key} ${renderType(value as s.ObjectSchema, {
                    typeResolver,
                    indent,
                    noResolve: true,
                })}`;

                // todo: support more types
            }
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
