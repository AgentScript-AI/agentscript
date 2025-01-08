import type { AgentDefinition } from '../defineAgent.js';
import { renderModule } from './renderModule.js';
import { renderVariable } from './renderVariable.js';

/**
 * Render a runtime as TypeScript code.
 * @param agent - Agent to render.
 * @returns Rendered agent runtime.
 */
export function renderRuntime(agent: AgentDefinition) {
    let code = renderModule(agent.tools);

    if (agent.output) {
        code += '\n\n';
        code += renderVariable({
            name: 'result',
            type: agent.output,
            description: 'You must put the result of the task here.',
        });
    }

    return code;
}
