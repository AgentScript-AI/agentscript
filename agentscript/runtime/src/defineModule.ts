import * as z from 'zod';

import { INDENT } from './constants.js';
import type { FunctionDefinition } from './defineFunction.js';
import { renderComment } from './utils/renderComment.js';
import { renderType } from './utils/renderType.js';
import { createTypeResolver } from './utils/typeResolver.js';

export type Module = ReturnType<typeof defineModule>;

export type ModuleDefinition = {
    [name: string]: z.ZodTypeAny | FunctionDefinition;
};

const VALID_NAME_REGEX = /^[a-zA-Z_][a-zA-Z_0-9]*$/;

export function defineModule<M extends ModuleDefinition>(definitions: M) {
    // todo: check if name is valid

    const typeResolver = createTypeResolver();

    for (const [key, value] of Object.entries(definitions)) {
        if (!VALID_NAME_REGEX.test(key)) {
            throw new Error(
                `Invalid name: ${key}. Names must start with a letter or underscore and can only contain letters, numbers, and underscores.`,
            );
        }

        if (value instanceof z.ZodObject) {
            typeResolver.add(key, value as z.AnyZodObject);
        }
    }

    return {
        definitions,
        render,
    };

    function render(namespace: string) {
        let code = `declare namespace ${namespace} {`;

        for (const [key, value] of Object.entries(definitions)) {
            if (value instanceof z.ZodObject) {
                code += `\n${INDENT}export interface ${key} ${renderType(value as z.ZodTypeAny, {
                    typeResolver,
                    indent: INDENT,
                    noResolve: true,
                })}\n`;
            }

            if (value instanceof z.ZodType) {
                // todo: support more types
                continue;
            }

            code += renderFunction(key, value);
        }

        code += '}';

        return code;
    }

    function renderFunction(key: string, func: FunctionDefinition) {
        let code = '';
        let args = '';

        const description = func.description
            ? Array.isArray(func.description)
                ? func.description
                : [func.description]
            : [];

        for (const [name, arg] of Object.entries(func.args)) {
            if (args.length > 0) {
                args += ', ';
            }

            args += `${name}: ${renderType(arg, { typeResolver })}`;

            if (arg.description) {
                description.push(`@param ${name} - ${arg.description}`);
            }
        }

        if (func.return.description) {
            description.push(`@returns ${func.return.description}`);
        }

        const comment = renderComment(description, INDENT);
        if (comment) {
            code += `\n${comment}`;
        }

        const returnType = renderType(func.return, { typeResolver });

        code += `\n${INDENT}export function ${key}(${args}): ${returnType};\n`;

        return code;
    }
}
