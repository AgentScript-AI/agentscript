import type { ToolDefinition } from '../defineTool.js';
import { renderComment } from './renderComment.js';
import { renderTypeInline, renderTypeNamed } from './renderType.js';
import type { TypeResolver } from './typeResolver.js';

interface RenderToolOptions {
    func: ToolDefinition;
    name: string;
    indent?: string;
    typeResolver: TypeResolver;
}

/**
 * Render a tool as TypeScript code.
 * @param options - Options for the tool.
 * @returns Rendered tool.
 */
export function renderTool(options: RenderToolOptions) {
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

    if (func.input) {
        for (const [name, arg] of Object.entries(func.input.props)) {
            if (args.length > 0) {
                args += ', ';
            }

            args += `${name}: ${renderTypeInline(arg, { typeResolver })}`;

            if (arg.description) {
                description.push(`@param ${name} - ${arg.description}`);
            }
        }
    }

    if (func.output.description) {
        description.push(`@returns ${func.output.description}`);
    }

    const comment = renderComment(description, indent);
    if (comment) {
        code += `${comment}\n`;
    }

    const returnType = renderTypeInline(func.output, { typeResolver });

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
