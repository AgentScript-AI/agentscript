import * as z from 'zod';

import { INDENT, renderType } from './utils/renderType.js';
import { createTypeResolver } from './utils/typeResolver.js';

export type Module = ReturnType<typeof defineModule>;

export type ModuleDefinition = {
    [name: string]: z.ZodTypeAny | string;
};

export function defineModule<M extends ModuleDefinition>(name: string, definitions: M) {
    // todo: check if name is valid

    const typeResolver = createTypeResolver();

    for (const [key, value] of Object.entries(definitions)) {
        if (value instanceof z.ZodObject) {
            typeResolver.add(key, value as z.AnyZodObject);
        }
    }

    return {
        name,
        definitions,
        getCode,
    };

    function getCode() {
        let code = `declare namespace ${name} {`;

        for (const [key, value] of Object.entries(definitions)) {
            if (value instanceof z.ZodObject) {
                code += `\n${INDENT}export interface ${key} ${renderType(value as z.ZodTypeAny, {
                    typeResolver,
                    indent: INDENT,
                })}\n`;
            }
        }

        code += '}';

        return code;
    }
}
