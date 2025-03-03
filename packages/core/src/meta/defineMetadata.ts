import type { Agent } from '../agent/agentTypes.js';

/**
 * Metadata options
 */
export interface MetadataOptions {
    /**
     * The name of the metadata
     */
    name: string;
}

/**
 * Metadata is a record of arbitrary data.
 */
export type Metadata = Record<string, unknown>;

/**
 * Metadata definition
 */
export interface MetadataDefinition<T> {
    /**
     * Get metadata value from an agent
     */
    (agent: Agent): T | undefined;

    /**
     * Get metadata value from a wrapper
     */
    (wrapper: MetadataWrapper): T | undefined;

    /**
     * Set metadata value on an agent
     */
    (agent: Agent, value: T): void;

    /**
     * Set metadata value on a wrapper
     */
    (wrapper: MetadataWrapper, value: T): void;
}

/**
 * Generic metadata wrapper.
 */
export interface MetadataWrapper {
    /**
     * Metadata.
     */
    metadata: Metadata;
}

/**
 * Define agent metadata.
 * Can be used to store arbitrary data within an agent.
 * @param options - The metadata options
 * @returns The metadata
 */
export function defineMetadata<T>(options: MetadataOptions): MetadataDefinition<T> {
    const wrapper: Record<string, MetadataDefinition<T>> = {
        [options.name]: function (wrapper: MetadataWrapper, value?: T) {
            if (value === undefined) {
                return wrapper.metadata[options.name] as T | undefined;
            }

            wrapper.metadata[options.name] = value;
        },
    };

    return wrapper[options.name]!;
}
