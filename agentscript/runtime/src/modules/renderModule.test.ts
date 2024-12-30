import { expect, test } from 'vitest';

import * as s from '@agentscript/schema';

import { defineFunction } from '../defineFunction.js';
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

test('module with function', () => {
    const User = s.object({
        props: {
            name: s.string(),
            email: s.string(),
        },
    });

    const getUser = defineFunction({
        description: 'Get a user',
        args: {
            id: s.string({
                description: 'The id of the user',
            }),
        },
        return: s.extend(User, {
            description: 'The user',
        }),
        handler: ({ args: { id } }) => {
            return {
                id,
                name: 'John',
                email: 'john@example.com',
            };
        },
    });

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
