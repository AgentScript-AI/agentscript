import type { Schema } from '@agentscript.ai/schema';

import type { FunctionDefinition } from './defineFunction.js';
import type { Module } from './modules/renderModule.js';

export type Runtime = {
    [name: string]: Schema | FunctionDefinition | Module;
} & {
    [name: `$${string}`]: Schema;
};

export function defineRuntime<TRuntime extends Runtime>(runtime: TRuntime) {
    return runtime;
}
