import { expect, test } from 'vitest';

import * as s from '@agentscript-ai/schema';
import { joinLines } from '@agentscript-ai/utils';

import { createRenderContext } from './renderContext.js';
import { renderModule } from './renderModule.js';
import { defineTool } from '../tools/defineTool.js';

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
            'type User = {',
            '  name: string;',
            '  email: string;',
            '}',
            '',
            '/**',
            ' * Get a user',
            ' * @returns The user',
            ' */',
            'function getUser(id: string): User;',
            '',
            '/** Noop */',
            'function noop(): void;',
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
            'namespace nested {',
            '',
            '  /** Noop */',
            '  function noop(): void;',
            '',
            '  type User = {',
            '    name: string;',
            '    email: string;',
            '  }',
            '',
            '  /**',
            '   * Get a user',
            '   * @returns The user',
            '   */',
            '  function getUser(id: string): User;',
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
            'namespace nested {',
            '',
            '  type User = {',
            '    name: string;',
            '    email: string;',
            '  }',
            '',
            '  /**',
            '   * Get a user',
            '   * @returns The user',
            '   */',
            '  function getUser(id: string): User;',
            '',
            '  /** Noop */',
            '  function noop(): void;',
            '',
            '  namespace nested {',
            '',
            '    /** Noop */',
            '    function noop(): void;',
            '',
            '    /**',
            '     * Get a user',
            '     * @returns The user',
            '     */',
            '    function getUser(id: string): User;',
            '  }',
            '}',
        ]),
    );
});
