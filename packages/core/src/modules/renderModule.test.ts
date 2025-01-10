import { expect, test } from 'vitest';

import * as s from '@agentscript-ai/schema';
import { joinLines } from '@agentscript-ai/utils';

import { defineTool } from '../defineTool.js';
import { createRenderContext } from './renderContext.js';
import { renderModule } from './renderModule.js';

const User = s.object({
    name: 'User',
    props: {
        name: s.string(),
        email: s.string(),
    },
});

const getUser = defineTool({
    description: 'Get a user',
    input: {
        id: s.string(),
    },
    output: s.extend(User, {
        description: 'The user',
    }),
    handler: () => ({ name: 'John', email: 'john@example.com' }),
});

const noop = defineTool({
    description: 'Noop',
    handler: () => {},
});

test('simple module', () => {
    const module = {
        getUser,
        noop,
    };

    const ctx = createRenderContext();
    renderModule(module, ctx);

    expect(ctx.code).toEqual(
        joinLines([
            //
            'export type User = {',
            '  name: string;',
            '  email: string;',
            '}',
            '',
            '/**',
            ' * Get a user',
            ' * @returns The user',
            ' */',
            'export function getUser(id: string): User;',
            '',
            '/** Noop */',
            'export function noop(): void;',
        ]),
    );
});

test('nested module', () => {
    const module = {
        nested: {
            noop,
            getUser,
        },
    };

    const ctx = createRenderContext();
    renderModule(module, ctx);

    expect(ctx.code).toEqual(
        joinLines([
            'declare namespace nested {',
            '',
            '  /** Noop */',
            '  export function noop(): void;',
            '',
            '  export type User = {',
            '    name: string;',
            '    email: string;',
            '  }',
            '',
            '  /**',
            '   * Get a user',
            '   * @returns The user',
            '   */',
            '  export function getUser(id: string): User;',
            '}',
        ]),
    );
});

test('double nested module', () => {
    const module = {
        nested: {
            getUser,
            noop,

            nested: {
                noop,
                getUser,
            },
        },
    };

    const ctx = createRenderContext();
    renderModule(module, ctx);

    expect(ctx.code).toEqual(
        joinLines([
            'declare namespace nested {',
            '',
            '  export type User = {',
            '    name: string;',
            '    email: string;',
            '  }',
            '',
            '  /**',
            '   * Get a user',
            '   * @returns The user',
            '   */',
            '  export function getUser(id: string): User;',
            '',
            '  /** Noop */',
            '  export function noop(): void;',
            '',
            '  declare namespace nested {',
            '',
            '    /** Noop */',
            '    export function noop(): void;',
            '',
            '    /**',
            '     * Get a user',
            '     * @returns The user',
            '     */',
            '    export function getUser(id: string): User;',
            '  }',
            '}',
        ]),
    );
});
