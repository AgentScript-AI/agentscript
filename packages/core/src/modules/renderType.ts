import * as s from '@agentscript.ai/schema';

import type { TypeResolver } from './typeResolver.js';
import { INDENT } from '../constants.js';
import { renderComment } from './renderComment.js';

/**
 * Options for {@link renderTypeInline}.
 */
export interface RenderTypeOptions {
    /**
     * Indentation to use.
     */
    indent?: string;
    /**
     * Type resolver to use.
     */
    typeResolver?: TypeResolver;
}

/**
 * Options for {@link renderTypeNamed}.
 */
export interface RenderTypeNamedOptions extends RenderTypeOptions {
    /**
     * Name of the type.
     */
    name: string;
}

/**
 * Render a schema as TypeScript code.
 * @param schema - Schema to render.
 * @param options - Options for the schema.
 * @returns Rendered schema.
 */
export function renderTypeNamed(schema: s.Schema, options: RenderTypeNamedOptions): string {
    const { name, indent = '', typeResolver } = options;
    const type = renderTypeInternal(schema, indent, typeResolver, false, true);
    return `${indent}export interface ${name} ${type}`;
}

/**
 * Render a schema as inline TypeScript type.
 * @param schema - Schema to render.
 * @param options - Options for the schema.
 * @returns Rendered schema.
 */
export function renderTypeInline(schema: s.Schema, options: RenderTypeOptions = {}): string {
    return renderTypeInternal(schema, options.indent ?? '', options.typeResolver, false, false);
}

function renderTypeInternal(
    schema: s.Schema,
    indent: string = '',
    typeResolver?: TypeResolver,
    skipUndefined?: boolean,
    skipResolving?: boolean,
): string {
    let type = renderInner(schema, indent, typeResolver, skipResolving);

    if (schema.nullable) {
        type = `${type} | null`;
    }

    if (schema.optional && !skipUndefined && schema.base !== s.void) {
        type = `${type} | undefined`;
    }

    return type;
}

function renderInner(
    schema: s.Schema,
    indent: string,
    typeResolver?: TypeResolver,
    skipResolving?: boolean,
) {
    switch (schema.base) {
        case s.string:
            return 'string';
        case s.number:
            return 'number';
        case s.boolean:
            return 'boolean';
        case s.date:
            return 'Date';
        case s.void:
            return 'void';
        case s.unknown:
            return 'unknown';
        case s.enum:
            return renderEnum(schema as s.EnumSchema);
        case s.object:
            if (!skipResolving) {
                const resolved = typeResolver?.getName(schema as s.ObjectSchema);
                if (resolved) {
                    return resolved;
                }
            }

            return renderObject(schema as s.ObjectSchema, indent, typeResolver);
        case s.array:
            return renderArray(schema as s.ArraySchema, indent, typeResolver);

        case s.union:
            return renderUnion(schema as s.UnionSchema, indent, typeResolver);
        default:
            throw new Error(`Unsupported schema ${schema.base.name}`);
    }
}

function renderObject(schema: s.ObjectSchema, indent: string, typeResolver?: TypeResolver) {
    const props = schema.props;
    const propsIndent = indent + INDENT;

    let code = '{\n';
    // eslint-disable-next-line prefer-const
    for (let [key, value] of Object.entries(props)) {
        const optional = value.optional;
        if (optional) {
            key += '?';
        }

        const description = value.description;
        if (description) {
            const comment = renderComment(description, propsIndent);
            if (comment) {
                code += comment;
                code += '\n';
            }
        }

        const type = renderTypeInternal(value, propsIndent, typeResolver, optional);
        code += `${propsIndent}${key}: ${type};\n`;
    }

    code += `${indent}}`;

    return code;
}

function renderArray(schema: s.ArraySchema, indent: string, typeResolver?: TypeResolver) {
    if (schema.of.base === s.union) {
        return `(${renderUnion(schema.of as s.UnionSchema, indent, typeResolver)})[]`;
    }

    return `${renderTypeInternal(schema.of, indent, typeResolver)}[]`;
}

function renderUnion(schema: s.UnionSchema, indent: string, typeResolver?: TypeResolver) {
    return schema.of.map(option => renderTypeInternal(option, indent, typeResolver)).join(' | ');
}

function renderEnum(schema: s.EnumSchema) {
    return schema.values.map(option => `"${option}"`).join(' | ');
}
