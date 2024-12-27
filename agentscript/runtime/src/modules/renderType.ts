import * as z from 'zod';

import type { TypeResolver } from './typeResolver.js';
import { INDENT } from '../constants.js';

export interface RenderTypeOptions {
    indent?: string;
    typeResolver?: TypeResolver;
    noResolve?: boolean;
}

export function renderType(schema: z.ZodTypeAny, options: RenderTypeOptions = {}): string {
    return renderTypeInternal(
        schema,
        options.indent ?? '',
        options.typeResolver,
        false,
        options.noResolve ?? false,
    );
}

function renderTypeInternal(
    schema: z.ZodTypeAny,
    indent: string = '',
    typeResolver?: TypeResolver,
    skipUndefined?: boolean,
    skipResolving?: boolean,
): string {
    if (schema instanceof z.ZodString) {
        return 'string';
    } else if (schema instanceof z.ZodNumber) {
        return 'number';
    } else if (schema instanceof z.ZodBoolean) {
        return 'boolean';
    } else if (schema instanceof z.ZodDate) {
        return 'Date';
    } else if (schema instanceof z.ZodVoid) {
        return 'void';
    } else if (schema instanceof z.ZodUnknown) {
        return 'unknown';
    } else if (schema instanceof z.ZodAny) {
        return 'any';
    } else if (schema instanceof z.ZodNullable) {
        return `${renderTypeInternal(schema.unwrap() as z.ZodTypeAny, indent, typeResolver, skipUndefined)} | null`;
    } else if (schema instanceof z.ZodOptional) {
        if (skipUndefined) {
            return renderTypeInternal(schema.unwrap() as z.ZodTypeAny, indent, typeResolver);
        }

        return `${renderTypeInternal(schema.unwrap() as z.ZodTypeAny, indent, typeResolver)} | undefined`;
    }

    if (schema instanceof z.ZodObject) {
        if (!skipResolving) {
            const resolved = typeResolver?.resolve(schema as z.AnyZodObject);
            if (resolved) {
                return resolved;
            }
        }

        return renderObject(schema as z.AnyZodObject, indent, typeResolver);
    } else if (schema instanceof z.ZodArray) {
        return renderArray(schema as z.ZodArray<z.ZodTypeAny>, indent, typeResolver);
    } else if (schema instanceof z.ZodUnion) {
        return renderUnion(schema, indent, typeResolver);
    }

    throw new Error(`Unsupported schema: ${schema.constructor.name}`);
}

function renderObject(schema: z.AnyZodObject, indent: string, typeResolver?: TypeResolver) {
    const shape = schema.shape as z.ZodRawShape;
    const propsIndent = indent + INDENT;

    let code = '{\n';
    // eslint-disable-next-line prefer-const
    for (let [key, value] of Object.entries(shape)) {
        const optional = value.isOptional();
        if (optional) {
            key += '?';
        }

        const description = value.description;
        if (description) {
            code += `${propsIndent}/** ${description} */\n`;
        }

        const type = renderTypeInternal(value, propsIndent, typeResolver, optional);
        code += `${propsIndent}${key}: ${type};\n`;
    }

    code += `${indent}}`;

    return code;
}

function renderArray(
    schema: z.ZodArray<z.ZodTypeAny>,
    indent: string,
    typeResolver?: TypeResolver,
) {
    if (schema.element instanceof z.ZodUnion) {
        return `(${renderUnion(schema.element, indent, typeResolver)})[]`;
    }

    return `${renderTypeInternal(schema.element, indent, typeResolver)}[]`;
}

function renderUnion(schema: z.ZodTypeAny, indent: string, typeResolver?: TypeResolver) {
    return (schema as z.ZodUnion<readonly [z.ZodTypeAny, ...z.ZodTypeAny[]]>).options
        .map(option => renderTypeInternal(option, indent, typeResolver))
        .join(' | ');
}
