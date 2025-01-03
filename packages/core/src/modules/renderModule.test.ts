import { describe, expect, test } from 'vitest';

import * as s from '@agentscript-ai/schema';

import { defineTool } from '../defineTool.js';
import { renderModule } from './renderModule.js';
import { joinLines } from '../utils/joinLines.js';

test('simple module', () => {
    const User = s.object({
        props: {
            name: s.string(),
            email: s.string(),
        },
    });

    const module = {
        User,
    };

    const rendered = renderModule(module);

    expect(rendered).toEqual(
        joinLines([
            //
            'export interface User {',
            '  name: string;',
            '  email: string;',
            '}',
        ]),
    );
});

test('nested module', () => {
    const User = s.object({
        props: {
            name: s.string(),
            email: s.string(),
        },
    });

    const module = {
        Test: {
            User,
        },
    };

    const rendered = renderModule(module);

    expect(rendered).toEqual(
        joinLines([
            'declare namespace Test {',
            '  export interface User {',
            '    name: string;',
            '    email: string;',
            '  }',
            '}',
        ]),
    );
});

test('nested object', () => {
    const User = s.object({
        props: {
            name: s.string(),
            email: s.string(),
        },
    });

    const Company = s.object({
        props: {
            name: s.string(),
            employees: s.array({
                of: User,
                description: 'The employees of the company',
            }),
        },
    });

    const module = {
        User,
        Company,
    };

    const rendered = renderModule(module);

    expect(rendered).toEqual(
        joinLines([
            'export interface User {',
            '  name: string;',
            '  email: string;',
            '}',
            '',
            'export interface Company {',
            '  name: string;',
            '  /** The employees of the company */',
            '  employees: User[];',
            '}',
        ]),
    );
});

describe('tools', () => {
    const User = s.object({
        props: {
            name: s.string(),
            email: s.string(),
        },
    });

    const getUser = defineTool({
        description: 'Get a user',
        input: {
            id: s.string({
                description: 'The id of the user',
            }),
        },
        output: s.extend(User, {
            description: 'The user',
        }),
        types: {
            User,
        },
        handler: ({ input: { id } }) => {
            return {
                id,
                name: 'John',
                email: 'john@example.com',
            };
        },
    });

    test('define types explicitly', () => {
        const module = {
            User,
            getUser,
        };

        const rendered = renderModule(module);

        expect(rendered).toEqual(
            joinLines([
                'export interface User {',
                '  name: string;',
                '  email: string;',
                '}',
                '',
                '/**',
                ' * Get a user',
                ' * @param id - The id of the user',
                ' * @returns The user',
                ' */',
                'export function getUser(id: string): User;',
            ]),
        );
    });

    test('define types implicitly', () => {
        const module = {
            // type is inferred from function return type
            getUser,
        };

        const rendered = renderModule(module);

        expect(rendered).toEqual(
            joinLines([
                'export interface User {',
                '  name: string;',
                '  email: string;',
                '}',
                '',
                '/**',
                ' * Get a user',
                ' * @param id - The id of the user',
                ' * @returns The user',
                ' */',
                'export function getUser(id: string): User;',
            ]),
        );
    });

    test('define types implicitly and use twice', () => {
        const module = {
            // type is inferred from function return type
            getUser,
            getUser2: getUser,
        };

        const rendered = renderModule(module);

        expect(rendered).toEqual(
            joinLines([
                'export interface User {',
                '  name: string;',
                '  email: string;',
                '}',
                '',
                '/**',
                ' * Get a user',
                ' * @param id - The id of the user',
                ' * @returns The user',
                ' */',
                'export function getUser(id: string): User;',
                '',
                '/**',
                ' * Get a user',
                ' * @param id - The id of the user',
                ' * @returns The user',
                ' */',
                'export function getUser2(id: string): User;',
            ]),
        );
    });

    test('renamed type before function', () => {
        const module = {
            User2: User,
            getUser,
        };

        const rendered = renderModule(module);

        expect(rendered).toEqual(
            joinLines([
                'export interface User2 {',
                '  name: string;',
                '  email: string;',
                '}',
                '',
                '/**',
                ' * Get a user',
                ' * @param id - The id of the user',
                ' * @returns The user',
                ' */',
                'export function getUser(id: string): User2;',
            ]),
        );
    });

    test('renamed type after function', () => {
        const module = {
            getUser,
            // type is not duplicated
            User2: User,
        };

        const rendered = renderModule(module);

        expect(rendered).toEqual(
            joinLines([
                '/**',
                ' * Get a user',
                ' * @param id - The id of the user',
                ' * @returns The user',
                ' */',
                'export function getUser(id: string): User2;',
                '',
                'export interface User2 {',
                '  name: string;',
                '  email: string;',
                '}',
            ]),
        );
    });

    test('name collision before function', () => {
        const User2 = s.object({
            props: {
                id: s.string(),
                name: s.string(),
            },
        });

        const module = {
            User: User2,
            getUser,
        };

        const rendered = renderModule(module);

        expect(rendered).toEqual(
            joinLines([
                'export interface User {',
                '  id: string;',
                '  name: string;',
                '}',
                '',
                'export interface User2 {',
                '  name: string;',
                '  email: string;',
                '}',
                '',
                '/**',
                ' * Get a user',
                ' * @param id - The id of the user',
                ' * @returns The user',
                ' */',
                'export function getUser(id: string): User2;',
            ]),
        );
    });

    test('name collision after function', () => {
        const User2 = s.object({
            props: {
                id: s.string(),
                name: s.string(),
            },
        });

        const module = {
            getUser,
            User: User2,
        };

        const rendered = renderModule(module);

        expect(rendered).toEqual(
            joinLines([
                'export interface User2 {',
                '  name: string;',
                '  email: string;',
                '}',
                '',
                '/**',
                ' * Get a user',
                ' * @param id - The id of the user',
                ' * @returns The user',
                ' */',
                'export function getUser(id: string): User2;',
                '',
                'export interface User {',
                '  id: string;',
                '  name: string;',
                '}',
            ]),
        );
    });

    test('more than 2 params', () => {
        const tool = defineTool({
            description: 'Get a foobar',
            input: {
                a: s.number({ description: 'The first number' }),
                b: s.number({ description: 'The second number' }),
                c: s.number({ description: 'The third number' }),
            },
            output: s.number(),
            handler({ input }) {
                return input.a + input.b + input.c;
            },
        });

        const module = {
            tool,
        };

        const rendered = renderModule(module);

        expect(rendered).toEqual(
            joinLines([
                'export interface ToolParams {',
                '  /** The first number */',
                '  a: number;',
                '  /** The second number */',
                '  b: number;',
                '  /** The third number */',
                '  c: number;',
                '}',
                '',
                '/** Get a foobar */',
                'export function tool(params: ToolParams): number;',
            ]),
        );
    });

    test('explicit input schema', () => {
        const input = s.object({
            props: {
                a: s.number({ description: 'The first number' }),
                b: s.number({ description: 'The second number' }),
                c: s.number({ description: 'The third number' }),
            },
        });

        const tool = defineTool({
            description: 'Get a foobar',
            input: input,
            output: s.number(),
            handler({ input }) {
                return input.a + input.b + input.c;
            },
        });

        const module = {
            tool,
        };

        const rendered = renderModule(module);

        expect(rendered).toEqual(
            joinLines([
                'export interface ToolParams {',
                '  /** The first number */',
                '  a: number;',
                '  /** The second number */',
                '  b: number;',
                '  /** The third number */',
                '  c: number;',
                '}',
                '',
                '/** Get a foobar */',
                'export function tool(params: ToolParams): number;',
            ]),
        );
    });

    test('explicit input schema with name', () => {
        const input = s.object({
            name: 'Params',
            props: {
                a: s.number({ description: 'The first number' }),
                b: s.number({ description: 'The second number' }),
                c: s.number({ description: 'The third number' }),
            },
        });

        const tool = defineTool({
            description: 'Get a foobar',
            input: input,
            output: s.number(),
            handler({ input }) {
                return input.a + input.b + input.c;
            },
        });

        const module = {
            tool,
        };

        const rendered = renderModule(module);

        expect(rendered).toEqual(
            joinLines([
                'export interface Params {',
                '  /** The first number */',
                '  a: number;',
                '  /** The second number */',
                '  b: number;',
                '  /** The third number */',
                '  c: number;',
                '}',
                '',
                '/** Get a foobar */',
                'export function tool(params: Params): number;',
            ]),
        );
    });
});
