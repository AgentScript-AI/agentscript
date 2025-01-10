import type * as s from '@agentscript-ai/schema';

const INDENT = '  ';

/**
 * Render context.
 */
export interface RenderContext {
    /**
     * Rendered code.
     */
    readonly code: string;
    /**
     * Indentation to use.
     */
    readonly indent: string;
    /**
     * Root context.
     */
    readonly root: RenderContext;
    /**
     * Parent context.
     */
    readonly parent?: RenderContext;
    /**
     * Ambient context.
     */
    readonly ambient: RenderContext;
    /**
     * Get a type by schema.
     */
    getTypeName(schema: s.Schema): string | undefined;
    /**
     * Get a type by name.
     */
    getTypeSchema(name: string): s.Schema | undefined;
    /**
     * Add a type.
     */
    addType(schema: s.Schema, name: string): void;
    /**
     * Add a line of code.
     */
    addLine(line?: string): void;
    /**
     * Add code without indentation.
     */
    addCode(code: string): void;
    /**
     * Create a child context.
     */
    createChild(namespace?: string): RenderContext;
}

/**
 * Create a render context.
 * @param parent - Parent context.
 * @returns Render context.
 */
export function createRenderContext(): RenderContext {
    const typesBySchema = new Map<s.SchemaProto, string>();
    const typesByName = new Map<string, s.Schema>();

    let code: string = '';

    return {
        get code() {
            return code;
        },
        get root() {
            return this;
        },
        get ambient() {
            return this;
        },
        indent: '',
        getTypeName(schema: s.Schema) {
            return typesBySchema.get(schema.proto);
        },
        getTypeSchema(name: string) {
            return typesByName.get(name);
        },
        addType(schema: s.Schema, name: string) {
            typesBySchema.set(schema.proto, name);
            typesByName.set(name, schema);
        },
        addLine(line?: string) {
            if (code) {
                code += '\n';
            }

            if (line !== undefined) {
                code += line;
            }
        },
        addCode(line: string) {
            code += line;
        },
        createChild(namespace?: string) {
            return createRenderContextChild(this, namespace);
        },
    };
}

function createRenderContextChild(parent: RenderContext, namespace?: string): RenderContext {
    const typesBySchema = new Map<s.SchemaProto, string>();
    const typesByName = new Map<string, s.Schema>();

    const root = parent.root;
    const indent = parent.indent + INDENT;

    return {
        get code() {
            return root.code;
        },
        get ambient() {
            if (namespace) {
                return this;
            }

            return parent.ambient;
        },
        indent,
        parent,
        root,
        getTypeName(schema: s.Schema) {
            return typesBySchema.get(schema.proto) ?? parent.getTypeName(schema);
        },
        getTypeSchema(name: string) {
            return typesByName.get(name) ?? parent.getTypeSchema(name);
        },
        addType(schema: s.Schema, name: string) {
            typesBySchema.set(schema.proto, name);
            typesByName.set(name, schema);

            const fullName = namespace ? `${namespace}.${name}` : name;
            parent.addType(schema, fullName);
        },
        addLine(line?: string) {
            if (line) {
                line = indent + line;
            }

            root.addLine(line);
        },
        addCode(code: string) {
            root.addCode(code);
        },
        createChild(namespace?: string) {
            return createRenderContextChild(this, namespace);
        },
    };
}
