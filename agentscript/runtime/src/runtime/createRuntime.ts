import { createMemo } from '@nzyme/utils';

import type { Module } from '../defineModule.js';

export type RuntimeOptions = {
    modules: {
        [name: string]: Module;
    };
};

export type Runtime = ReturnType<typeof createRuntime>;

export function createRuntime(options: RuntimeOptions) {
    const code = createMemo(render);

    return {
        modules: options.modules,
        code,
    };

    function render() {
        let code = '';

        for (const [name, module] of Object.entries(options.modules)) {
            if (code.length > 0) {
                code += '\n\n';
            }

            code += module.render(name);
        }

        return code;
    }
}
