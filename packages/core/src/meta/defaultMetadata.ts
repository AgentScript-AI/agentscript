import { defineMetadata } from './defineMetadata.js';

/**
 * Stores the prompt of the agent.
 * @example
 * ```typescript
 * const prompt = promptMetadata(agent);
 * ```
 */
export const promptMetadata = defineMetadata<string>({ name: 'agentscript:prompt' });

/**
 * Stores the plan of the agent.
 * @example
 * ```typescript
 * const plan = planMetadata(agent);
 * ```
 */
export const planMetadata = defineMetadata<string>({ name: 'agentscript:plan' });
