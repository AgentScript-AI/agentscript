import type { AgentDefinition } from '../agent/defineAgent.js';
import { createRenderContext } from './renderContext.js';
import { renderModule } from './renderModule.js';
import { renderVariable } from './renderVariable.js';

/**
 * Render a runtime as TypeScript code.
 * @param agent - Agent to render.
 * @returns Rendered agent runtime.
 */
export function renderRuntime(agent: AgentDefinition) {
    const ctx = createRenderContext();

    renderModule(agent.tools, ctx);

    if (agent.output) {
        renderVariable({
            name: 'result',
            type: agent.output,
            description: 'You must put the result of the task here.',
            ctx,
        });
    }

    return ctx.code;
}
