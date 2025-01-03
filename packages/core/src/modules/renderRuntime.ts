import type { Runtime } from '../defineRuntime.js';
import { renderModule } from './renderModule.js';
import { renderVariable } from './renderVariable.js';

/**
 * Render a runtime as TypeScript code.
 * @param runtime - Runtime to render.
 * @returns Rendered runtime.
 */
export function renderRuntime(runtime: Runtime) {
    let code = renderModule(runtime.tools);

    if (runtime.output) {
        code += '\n\n';
        code += renderVariable({
            name: 'result',
            type: runtime.output,
            description: 'You must put the result of the task here.',
        });
    }

    return code;
}
