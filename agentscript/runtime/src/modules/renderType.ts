import * as s from '@agentscript/schema';

import type { TypeResolver } from './typeResolver.js';
import { INDENT } from '../constants.js';

export interface RenderTypeOptions {
    indent?: string;
    typeResolver?: TypeResolver;
    noResolve?: boolean;
}

export function renderType(schema: s.Schema, options: RenderTypeOptions = {}): string {
    return renderTypeInternal(
        schema,
        options.indent ?? '',
        options.typeResolver,
        false,
        options.noResolve ?? false,
    );
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
        case s.object:
            if (!skipResolving) {
                const resolved = typeResolver?.resolve(schema as s.ObjectSchema);
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
            throw new Error(`Unsupported schema`);
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
            code += `${propsIndent}/** ${description} */\n`;
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
