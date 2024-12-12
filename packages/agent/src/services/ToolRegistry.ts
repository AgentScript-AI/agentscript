import { type ToolCall, ToolMessage } from '@langchain/core/messages/tool';
import type { StructuredToolParams } from '@langchain/core/tools';
import type z from 'zod';

import { Logger } from '@chorus/core';
import type { AgentState, ToolDefinition } from '@chorus/core';
import { CreateLinearTaskTool } from '@chorus/linear';
import { SearchKnowledgeTool } from '@chorus/rag';
import { defineService } from '@nzyme/ioc';
import type { Immutable } from '@nzyme/types';
import { assertValue, createStopwatch } from '@nzyme/utils';

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

        function registerTool<TInput extends z.AnyZodObject, TOutput extends z.ZodTypeAny>(
            tool: ToolDefinition<TInput, TOutput>,
        ) {
            toolsDefs.push({
                name: tool.name,
                description: tool.description,
                schema: tool.input,
            });
            toolsMap.set(tool.name, tool as unknown as ToolDefinition);
        }

        async function callTool(call: ToolCall, state: Immutable<AgentState>) {
            logger.debug('Calling tool %O', {
                tool: call.name,
                args: call.args,
            });

            const stopwatch = createStopwatch();
            const id = assertValue(call.id, 'Tool call ID is required');
            const tool = toolsMap.get(call.name);
            if (!tool) {
                throw new Error(`Tool ${call.name} not found`);
            }

            const result = await inject(tool)(call.args, state);

            logger.debug('Tool call completed', {
                tool: call.name,
                args: call.args,
                duration: stopwatch.format(),
            });

            return new ToolMessage({
                content: serializeResult(result),
                name: call.name,
                tool_call_id: id,
            });
        }

        function serializeResult(result: unknown) {
            if (typeof result === 'object') {
                return JSON.stringify(result);
            }

            return String(result);
        }
    },
});
