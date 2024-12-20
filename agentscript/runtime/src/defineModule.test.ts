import { expect, test } from 'vitest';
import * as z from 'zod';

import { defineModule } from './defineModule.js';
import { joinLines } from './utils/joinLines.js';

test('simple module', () => {
    const User = z.object({
        name: z.string(),
        email: z.string().email(),
    });

    const module = defineModule('Test', {
        User,
    });

    expect(module.name).toEqual('Test');
    expect(module.getCode()).toEqual(
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

    const module = defineModule('Test', {
        User,
        Company,
    });

    expect(module.getCode()).toEqual(
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
