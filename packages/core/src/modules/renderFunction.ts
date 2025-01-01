import type { FunctionDefinition } from '../defineFunction.js';
import { renderComment } from './renderComment.js';
import { renderTypeInline, renderTypeNamed } from './renderType.js';
import type { TypeResolver } from './typeResolver.js';

interface RenderFunctionOptions {
    func: FunctionDefinition;
    name: string;
    indent?: string;
    typeResolver: TypeResolver;
}

/**
 * Render a function as TypeScript code.
 * @param options - Options for the function.
 * @returns Rendered function.
 */
export function renderFunction(options: RenderFunctionOptions) {
    const { func, name, indent = '', typeResolver } = options;

    let code = '';
    let args = '';

    if (func.types) {
        for (const [typeName, typeSchema] of Object.entries(func.types)) {
            const existingName = typeResolver.getName(typeSchema);
            if (existingName) {
                continue;
            }

            const uniqueName = findUniqueName(typeName, typeResolver);
            typeResolver.add(uniqueName, typeSchema);

            code += renderTypeNamed(typeSchema, {
                name: uniqueName,
                indent,
                typeResolver,
            });
            code += '\n\n';
        }
    }

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

            args += `${name}: ${renderTypeInline(arg, { typeResolver })}`;

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

    const returnType = renderTypeInline(func.return, { typeResolver });

    code += `${indent}export function ${name}(${args}): ${returnType};`;

    return code;
}

function findUniqueName(name: string, typeResolver: TypeResolver) {
    let uniqueName = name;
    let i = 2;

    while (typeResolver.getSchema(uniqueName)) {
        uniqueName = name + i;
        i++;
    }

    return uniqueName;
}
