import { expect, test } from 'vitest';
import * as z from 'zod';

import { defineFunction } from '../defineFunction.js';
import { renderModule } from './renderModule.js';
import { joinLines } from '../utils/joinLines.js';

test('simple module', () => {
    const User = z.object({
        name: z.string(),
        email: z.string().email(),
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
    const User = z.object({
        name: z.string(),
        email: z.string().email(),
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
    const User = z.object({
        name: z.string(),
        email: z.string().email(),
    });

    const Company = z.object({
        name: z.string(),
        employees: z.array(User).describe('The employees of the company'),
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
    const User = z.object({
        name: z.string(),
        email: z.string().email(),
    });

    const getUser = defineFunction({
        description: 'Get a user',
        args: {
            id: z.string().describe('The id of the user'),
        },
        return: User.describe('The user'),
        handler: ({ id }) => {
            return Promise.resolve({
                id,
                name: 'John',
                email: 'john@example.com',
            });
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
