import { expect, test } from 'vitest';
import * as z from 'zod';

import { defineFunction } from './defineFunction.js';
import { defineModule } from './defineModule.js';
import { joinLines } from './utils/joinLines.js';

test('simple module', () => {
    const User = z.object({
        name: z.string(),
        email: z.string().email(),
    });

    const module = defineModule({
        User,
    });

    expect(module.render('Test')).toEqual(
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

test('nested module', () => {
    const User = z.object({
        name: z.string(),
        email: z.string().email(),
    });

    const Company = z.object({
        name: z.string(),
        employees: z.array(User).describe('The employees of the company'),
    });

    const module = defineModule({
        User,
        Company,
    });

    expect(module.render('Test')).toEqual(
        joinLines([
            'declare namespace Test {',
            '  export interface User {',
            '    name: string;',
            '    email: string;',
            '  }',
            '',
            '  export interface Company {',
            '    name: string;',
            '    /** The employees of the company */',
            '    employees: User[];',
            '  }',
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

    const module = defineModule({
        User,
        getUser,
    });

    expect(module.render('Test')).toEqual(
        joinLines([
            'declare namespace Test {',
            '  export interface User {',
            '    name: string;',
            '    email: string;',
            '  }',
            '',
            '  /**',
            '   * Get a user',
            '   * @param id - The id of the user',
            '   * @returns The user',
            '   */',
            '  export function getUser(id: string): User;',
            '}',
        ]),
    );
});
