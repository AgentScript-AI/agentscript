import { getMd5Hash } from '@nzyme/crypto-utils';

import { createRenderContext } from './renderContext.js';
import { renderModule } from './renderModule.js';
import { renderVariable } from './renderVariable.js';
import type { AgentRuntime } from '../agent/agentTypes.js';
import type { AgentDefinition } from '../agent/defineAgent.js';

/**
 * Render a runtime as TypeScript code.
 * @param agent - Agent to render.
 * @returns Rendered agent runtime.
 */
export function renderRuntime(agent: AgentDefinition): AgentRuntime {
    const ctx = createRenderContext();

    if (agent.tools) {
        renderModule(agent.tools, ctx);
    }

    if (agent.output) {
        renderVariable({
            name: 'result',
            type: agent.output,
            description: 'You must put the result of the task here.',
            ctx,
        });
    }

    const code = ctx.code;
    const hash = `${getMd5Hash(code)}:${code.length}`;

    return {
        code,
        hash,
    };
}
