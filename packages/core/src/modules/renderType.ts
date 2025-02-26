import { toPascalCase } from '@nzyme/utils';

import * as s from '@agentscript-ai/schema';
import { normalizeText } from '@agentscript-ai/utils';

import { renderComment } from './renderComment.js';
import type { RenderContext } from './renderContext.js';

/**
 * Options for {@link renderTypeInline}.
 */
export interface RenderTypeOptions {
    /**
     * Schema to render.
     */
    schema: s.Schema;
    /**
     * Render context.
     */
    ctx: RenderContext;
    /**
     * Name of the type.
     */
    nameHint?: string;
}

/**
 * Options for {@link renderTypeNamed}.
 */
export interface RenderTypeNamedOptions extends RenderTypeOptions {
    /**
     * Name of the type.
     */
    nameHint: string;
}

/**
 * Render a schema as named TypeScript type.
 * @param options - Options for the type to render.
 * @returns Rendered type name.
 */
export function renderType(options: RenderTypeOptions): string {
    const { schema, ctx, nameHint } = options;
    return renderTypeInternal(schema, ctx, false, nameHint);
}

function renderTypeInternal(
    schema: s.Schema,
    ctx: RenderContext,
    skipUndefined?: boolean,
    nameHint?: string,
): string {
    switch (schema.type) {
        case s.string:
            return wrapType(schema, 'string', skipUndefined);
        case s.number:
        case s.integer:
            return wrapType(schema, 'number', skipUndefined);
        case s.boolean:
            return wrapType(schema, 'boolean', skipUndefined);
        case s.bigint:
            return wrapType(schema, 'bigint', skipUndefined);
        case s.date:
            return wrapType(schema, 'Date', skipUndefined);
        case s.void:
            return 'void';
        case s.unknown:
            return 'unknown';
        case s.enum:
            return renderEnum(schema as s.EnumSchema, skipUndefined);
        case s.object: {
            let name = ctx.ambient.getTypeName(schema);
            if (name) {
                return wrapType(schema, name, skipUndefined);
            }

            name = schema.name || nameHint;
            if (name) {
                name = findUniqueName(name, ctx.ambient);

                ctx.ambient.addType(schema, name);

                const code = renderObject(schema as s.ObjectSchema, ctx.ambient);

                ctx.ambient.addLine();
                ctx.ambient.addLine(`export type ${name} = ${code}`);

                return wrapType(schema, name, skipUndefined);
            }

            const rendered = renderObject(schema as s.ObjectSchema, ctx);
            return wrapType(schema, rendered, skipUndefined);
        }
        case s.array:
            return renderArray(schema as s.ArraySchema, ctx, skipUndefined);
        case s.union:
            return renderUnion(schema as s.UnionSchema, ctx, skipUndefined);
        case s.record:
            return renderRecord(schema as s.RecordSchema, ctx, skipUndefined);
        case s.lazy:
            return renderLazy(schema as s.LazySchema, ctx, skipUndefined);
        default:
            throw new Error(`Unsupported schema ${schema.type.name}`);
    }
}

function renderObject(schema: s.ObjectSchema, ctx: RenderContext) {
    const props = schema.props;
    const propsCtx = ctx.createChild();

    let code = `{\n`;
    // eslint-disable-next-line prefer-const
    for (let [key, value] of Object.entries(props)) {
        const optional = value.optional;
        if (optional) {
            key += '?';
        }

        const description = value.description;
        if (description) {
            const comment = renderComment(normalizeText(description), propsCtx);
            if (comment) {
                code += comment;
                code += '\n';
            }
        }

        const type = renderTypeInternal(value, propsCtx, optional);
        code += `${propsCtx.indent}${key}: ${type};\n`;
    }

    code += `${ctx.indent}}`;

    return code;
}

function renderArray(schema: s.ArraySchema, ctx: RenderContext, skipUndefined?: boolean) {
    if (schema.of.type === s.union && (schema.of as s.UnionSchema).of.length > 1) {
        return `(${renderUnion(schema.of as s.UnionSchema, ctx, skipUndefined)})[]`;
    }

    const type = renderTypeInternal(schema.of, ctx, skipUndefined);

    if (schema.of.optional || schema.of.nullable) {
        return `(${type})[]`;
    }

    return `${type}[]`;
}

function renderUnion(schema: s.UnionSchema, ctx: RenderContext, skipUndefined?: boolean) {
    const type = schema.of
        .map(option => renderTypeInternal(option, ctx, skipUndefined))
        .join(' | ');
    return wrapType(schema, type, skipUndefined);
}

function renderRecord(schema: s.RecordSchema, ctx: RenderContext, skipUndefined?: boolean) {
    const type = `Record<string, ${renderTypeInternal(schema.of, ctx)}>`;
    return wrapType(schema, type, skipUndefined);
}

function renderLazy(schema: s.LazySchema, ctx: RenderContext, skipUndefined?: boolean) {
    const unwrapped = unwrapLazy(schema);
    const type = renderTypeInternal(unwrapped, ctx, skipUndefined);
    return wrapType(unwrapped, type, skipUndefined);
}

function renderEnum(schema: s.EnumSchema, skipUndefined?: boolean) {
    const type = schema.values.map(option => `"${option}"`).join(' | ');
    return wrapType(schema, type, skipUndefined);
}

function wrapType(schema: s.Schema, type: string, skipUndefined?: boolean) {
    if (schema.nullable) {
        type = `${type} | null`;
    }

    if (schema.optional && schema.type !== s.void && !skipUndefined) {
        type = `${type} | undefined`;
    }

    return type;
}

function findUniqueName(name: string, ctx: RenderContext) {
    let uniqueName = toPascalCase(name);
    let i = 2;

    while (ctx.getTypeSchema(uniqueName)) {
        uniqueName = name + i;
        i++;
    }

    return uniqueName;
}

function unwrapLazy(schema: s.LazySchema) {
    const inner = schema.of();

    const unwrapped: Partial<s.LazySchema> = schema;
    delete unwrapped.of;

    for (const key in inner) {
        (unwrapped as Record<string, unknown>)[key] = inner[key as keyof typeof inner];
    }

    return unwrapped as s.Schema;
}
