import * as s from '@agentscript-ai/schema';
import { normalizeText } from '@agentscript-ai/utils';

import type { ToolDefinition } from '../tools/defineTool.js';
import { renderComment } from './renderComment.js';
import type { RenderContext } from './renderContext.js';
import { renderDocDirective } from './renderDocDirective.js';
import { renderType } from './renderType.js';

interface RenderToolOptions {
    tool: ToolDefinition;
    name: string;
    ctx: RenderContext;
}

/**
 * Render a tool as TypeScript code.
 * @param options - Options for the tool.
 */
export function renderTool(options: RenderToolOptions) {
    const { tool, name, ctx } = options;

    let args = '';

    const description = normalizeText(tool.description);

    const input = tool.input;
    if (s.isSchema(input, s.object)) {
        if (tool.singleArg) {
            const inputTypeName = renderType({
                schema: input,
                ctx,
                nameHint: `${name}Params`,
            });

            if (input.description) {
                description.push(renderDocDirective(`param params -`, input.description));
            }

            args = `params: ${inputTypeName}`;
        } else {
            for (const [name, arg] of Object.entries(input.props)) {
                if (args.length > 0) {
                    args += ', ';
                }

                args += `${name}: ${renderType({ schema: arg, ctx })}`;

                if (arg.description) {
                    description.push(renderDocDirective(`param ${name} -`, arg.description));
                }
            }
        }
    }

    if (tool.output.description) {
        description.push(renderDocDirective('returns', tool.output.description));
    }

    const returnType = renderType({
        schema: tool.output,
        ctx,
        nameHint: `${name}Result`,
    });

    ctx.addLine();
    ctx.addLine();

    const comment = renderComment(description, ctx);
    if (comment) {
        ctx.addCode(comment);
    }

    ctx.addLine(`export function ${name}(${args}): ${returnType};`);
}
