import type { RuntimeModule } from '../agent/defineAgent.js';

/**
 * Convenience function to define a tool module with proper typing.
 * @param tools - The tools to define.
 * @returns The defined tool module.
 */
export function defineToolModule<T extends RuntimeModule>(tools: T) {
    return tools;
}
