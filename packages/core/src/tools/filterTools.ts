import type { ToolDefinition } from './defineTool.js';
import { isTool } from './defineTool.js';
import type { RuntimeModule } from '../agent/defineAgent.js';

/**
 * Filter tools by their names.
 * @param tools - The tools to filter.
 * @param toolNames - The names of the tools to filter.
 * @returns The filtered tools.
 */
export function filterTools(tools: RuntimeModule, toolNames: string[]) {
    const result: RuntimeModule = {};

    // Return early if no tools or tool names
    if (!tools || !toolNames.length) {
        return result;
    }

    for (const path of toolNames) {
        const parts = path.split('.');
        const tool = findTool(tools, parts);
        if (!tool) {
            continue;
        }

        setTool(result, parts, tool);
    }

    return result;
}

function findTool(
    tools: RuntimeModule,
    path: string[],
): ToolDefinition | RuntimeModule | undefined {
    let current: RuntimeModule = tools;

    // Traverse the path
    for (const segment of path) {
        const next = current[segment];
        if (!next) {
            return;
        }

        if (isTool(next)) {
            return next;
        }

        current = next;
    }

    return current;
}

function setTool(tools: RuntimeModule, path: string[], tool: ToolDefinition | RuntimeModule): void {
    let current = tools;
    // Traverse the path and create nested objects as needed
    for (let i = 0; i < path.length - 1; i++) {
        const segment = path[i]!;
        if (!(segment in current)) {
            current[segment] = {};
        }

        current = current[segment] as RuntimeModule;
    }

    // Set the tool at the final path segment
    const lastSegment = path[path.length - 1]!;
    current[lastSegment] = tool;
}
