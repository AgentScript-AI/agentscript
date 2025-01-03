import { toPascalCase } from '@nzyme/utils';
import type { ToolDefinition } from '../defineTool.js';
import { renderComment } from './renderComment.js';
import { renderDocDirective } from './renderDocDirective.js';
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
    const { func: tool, name, indent = '', typeResolver } = options;

    let code = '';
    let args = '';

    if (tool.types) {
        for (const [typeName, typeSchema] of Object.entries(tool.types)) {
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

    const description = tool.description
        ? Array.isArray(tool.description)
            ? tool.description
            : [tool.description]
        : [];

    if (tool.singleArg) {
        let inputTypeName = typeResolver.getName(tool.input);
        if (!inputTypeName) {
            inputTypeName = toPascalCase(tool.input.name || `${name}Params`);
            inputTypeName = findUniqueName(inputTypeName, typeResolver);
            typeResolver.add(inputTypeName, tool.input);

            code += renderTypeNamed(tool.input, {
                name: inputTypeName,
                indent,
                typeResolver,
            });
            code += '\n\n';
        }

        args = `params: ${inputTypeName}`;
    } else {
        for (const [name, arg] of Object.entries(tool.input.props)) {
            if (args.length > 0) {
                args += ', ';
            }

            args += `${name}: ${renderTypeInline(arg, { typeResolver })}`;

            if (arg.description) {
                description.push(renderDocDirective(`param ${name} -`, arg.description));
            }
        }
    }

    if (tool.output.description) {
        description.push(renderDocDirective('returns', tool.output.description));
    }

    const comment = renderComment(description, indent);
    if (comment) {
        code += `${comment}\n`;
    }

    const returnType = renderTypeInline(tool.output, { typeResolver });

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
