import type { RenderContext } from './renderContext.js';
import { renderTool } from './renderTool.js';
import type { RuntimeModule } from '../agent/defineAgent.js';
import { isTool } from '../tools/defineTool.js';

const VALID_NAME_REGEX = /^[a-zA-Z_][a-zA-Z_0-9]*$/;

/**
 * Render a runtime module as TypeScript code.
 * @param module - Runtime module to render.
 * @param ctx - Render context.
 */
export function renderModule(module: RuntimeModule, ctx: RenderContext) {
    for (const [name, value] of Object.entries(module)) {
        if (!VALID_NAME_REGEX.test(name)) {
            throw new Error(
                `Invalid name: ${name}. Names must start with a letter or underscore and can only contain letters, numbers, and underscores.`,
            );
        }

        if (isTool(value)) {
            renderTool({ name, tool: value, ctx });
        } else if (typeof value === 'object' && value !== null) {
            ctx.addLine();
            ctx.addLine(`declare namespace ${name} {`);
            renderModule(value, ctx.createChild(name));
            ctx.addLine('}');
        } else {
            throw new Error(`Invalid value: ${String(value)} for ${name}`);
        }
    }
}
