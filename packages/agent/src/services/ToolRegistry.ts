import type { StructuredToolParams } from '@langchain/core/tools';
import type * as z from 'zod';

import { Logger } from '@chorus/core';
import type { AgentState, ToolCall, ToolDefinition } from '@chorus/core';
import { CreateLinearTaskTool } from '@chorus/linear';
import { SearchKnowledgeTool } from '@chorus/rag';
import { defineService } from '@nzyme/ioc';
import { createStopwatch } from '@nzyme/utils';

export const ToolRegistry = defineService({
    name: 'ToolRegistry',
    setup({ inject }) {
        const toolsDefs: StructuredToolParams[] = [];
        const toolsMap = new Map<string, ToolDefinition>();
        const logger = inject(Logger);

        registerTool(SearchKnowledgeTool);
        registerTool(CreateLinearTaskTool);

        return {
            tools: toolsDefs,
            callTool,
        };

        function registerTool<TInput extends z.AnyZodObject>(tool: ToolDefinition<TInput>) {
            toolsDefs.push({
                name: tool.name,
                description: tool.description,
                schema: tool.input,
            });
            toolsMap.set(tool.name, tool as unknown as ToolDefinition);
        }

        async function callTool(call: ToolCall, state: AgentState) {
            logger.debug('Calling tool %O', {
                tool: call.tool,
                args: call.params,
            });

            const stopwatch = createStopwatch();
            const tool = toolsMap.get(call.tool);
            if (!tool) {
                throw new Error(`Tool ${call.tool} not found`);
            }

            const input = tool.input.parse(call.params);
            const result = await inject(tool)(input, { state, call });

            logger.debug('Tool call completed', {
                tool: call.tool,
                args: call.params,
                duration: stopwatch.format(),
            });

            return result;
        }
    },
});
