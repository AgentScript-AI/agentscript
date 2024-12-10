import type { StructuredToolParams } from '@langchain/core/tools';

import { defineService } from '@nzyme/ioc';
import type { Immutable } from '@nzyme/types';

import type { AgentState } from '../AgentState.js';
import { SearchKnowledgeTool } from '../tools/SearchKnowledgeTool.js';
import type { ToolDefinition, ToolInput } from '../utils/defineTool.js';

export const ToolRegistry = defineService({
    name: 'ToolRegistry',
    setup({ inject }) {
        const toolsDefs: StructuredToolParams[] = [];
        const toolsMap = new Map<string, ToolDefinition>();

        registerTool(SearchKnowledgeTool);

        return {
            tools: toolsDefs,
            callTool,
        };

        function registerTool(tool: ToolDefinition) {
            toolsDefs.push({
                name: tool.name,
                description: tool.description,
                schema: tool.schema,
            });
            toolsMap.set(tool.name, tool);
        }

        function callTool(name: string, input: ToolInput, state: Immutable<AgentState>) {
            const tool = toolsMap.get(name);
            if (!tool) {
                throw new Error(`Tool ${name} not found`);
            }

            return inject(tool)(input, state);
        }
    },
});
