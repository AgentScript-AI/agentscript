import type { FunctionDefinition } from '../defineFunction.js';
import { renderComment } from './renderComment.js';
import { renderType } from './renderType.js';
import type { TypeResolver } from './typeResolver.js';

interface RenderFunctionOptions {
    func: FunctionDefinition;
    name: string;
    indent?: string;
    typeResolver: TypeResolver;
}

export function renderFunction(options: RenderFunctionOptions) {
    const { func, name, indent = '', typeResolver } = options;

    let code = '';
    let args = '';

    const description = func.description
        ? Array.isArray(func.description)
            ? func.description
            : [func.description]
        : [];

    if (func.args) {
        for (const [name, arg] of Object.entries(func.args.props)) {
            if (args.length > 0) {
                args += ', ';
            }

            args += `${name}: ${renderType(arg, { typeResolver })}`;

            if (arg.description) {
                description.push(`@param ${name} - ${arg.description}`);
            }
        }
    }

    if (func.return.description) {
        description.push(`@returns ${func.return.description}`);
    }

    const comment = renderComment(description, indent);
    if (comment) {
        code += `${comment}\n`;
    }

    const returnType = renderType(func.return, { typeResolver });

    code += `${indent}export function ${name}(${args}): ${returnType};`;

    return code;
}
