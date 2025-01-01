import type { Schema } from '@agentscript.ai/schema';

import type { FunctionDefinition } from './defineFunction.js';

/**
 * AgentScript runtime.
 */
export type Runtime = RuntimeModule & {
    readonly [name: `$${string}`]: Schema;
};

/**
 * AgentScript runtime module.
 */
export type RuntimeModule = {
    readonly [name: string]: Schema | FunctionDefinition | RuntimeModule;
};

/**
 * Define a runtime.
 * @param runtime - Runtime to define.
 * @returns Defined runtime.
 */
export function defineRuntime<TRuntime extends Runtime>(runtime: TRuntime) {
    return runtime;
}
