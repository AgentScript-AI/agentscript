import type { StructuredToolParams } from '@langchain/core/tools';
import type * as z from 'zod';

import { Logger } from '@chorus/core';
import type {
    AgentState,
    ToolCall,
    ToolDefinition,
    ToolInteraction,
    ToolState,
} from '@chorus/core';
import { CreateLinearTaskTool } from '@chorus/linear';
import { SearchKnowledgeTool } from '@chorus/rag';
import { defineService } from '@nzyme/ioc';
import { createStopwatch } from '@nzyme/utils';

export interface ToolInvokeParams {
    call: ToolCall;
    state: AgentState;
}

export interface ToolInteractParams {
    call: ToolCall;
    state: AgentState;
    interaction: object;
}

export const ToolRegistry = defineService({
    name: 'ToolRegistry',
    setup({ inject }) {
        const tools: StructuredToolParams[] = [];
        const toolsMap = new Map<string, ToolDefinition>();
        const logger = inject(Logger);

        registerTool(SearchKnowledgeTool);
        registerTool(CreateLinearTaskTool);

        return {
            tools,
            invoke,
            interact,
        };

        function registerTool<
            TInput extends z.AnyZodObject,
            TState extends ToolState,
            TInteraction extends ToolInteraction,
        >(tool: ToolDefinition<TInput, TState, TInteraction>) {
            tools.push({
                name: tool.name,
                description: tool.description,
                schema: tool.input,
            });
            toolsMap.set(tool.name, tool as unknown as ToolDefinition);
        }

        async function invoke(params: ToolInvokeParams) {
            const { call, state } = params;

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
            const result = await inject(tool).invoke({ input, agent: state, call });

            if (result?.state) {
                state.tools[call.uid] = result.state;
            }

            logger.debug('Tool call completed', {
                tool: call.tool,
                args: call.params,
                duration: stopwatch.format(),
            });

            return result;
        }

        async function interact(params: ToolInteractParams) {
            const { call, state } = params;

            const tool = toolsMap.get(call.tool);
            if (!tool) {
                throw new Error(`Tool ${call.tool} not found`);
            }

            const input = tool.input.parse(call.params);
            const interaction = tool.interaction?.parse(params.interaction);
            const toolState = tool.state?.parse(state.tools[call.uid] || {});

            await inject(tool).interact?.({
                input,
                agent: state,
                call,
                interaction,
                state: toolState,
            });
        }
    },
});
