import * as s from '@agentscript-ai/schema';

import type { ToolResult, ToolResultHelper } from './toolResult.js';
import type { Agent } from '../runtime/createAgent.js';

const TOOL_SYMBOL = Symbol('tool');

type ObjectSchema = s.NonNullish<s.ObjectSchema> | undefined;
type ObjectOptions = s.ObjectSchemaProps | s.NonNullish<s.ObjectSchema> | undefined;

type SchemaFromOptions<T extends ObjectOptions = ObjectOptions> =
    T extends s.NonNullish<s.ObjectSchema>
        ? T
        : T extends s.ObjectSchemaProps
          ? s.ObjectSchema<{ props: T; nullable: false; optional: false }>
          : undefined;

type ValueFromOptions<T extends ObjectOptions = ObjectOptions> =
    T extends s.NonNullish<s.ObjectSchema>
        ? s.Infer<T>
        : T extends s.ObjectSchemaProps
          ? s.ObjectSchemaPropsValue<T>
          : undefined;

type ValueFromSchema<T extends s.Schema | undefined> = T extends s.Schema ? s.Infer<T> : undefined;

/**
 * Options for {@link defineTool}.
 */
export type ToolOptions<
    TInput extends ObjectOptions,
    TOutput extends s.Schema,
    TState extends ObjectOptions,
    TEvent extends s.Schema | undefined,
> = {
    /**
     * Description of the tool.
     * Should be descriptive and concise, so that LLM can understand what the tool does.
     */
    description?: string | string[];
    /**
     * Arguments for the tool.
     */
    input?: TInput;
    /**
     * Schema of the return value of the tool.
     * @default s.void()
     */
    output?: TOutput;
    /**
     * Schema of the state of the tool.
     */
    state?: TState;
    /**
     * Schema of the event of the tool.
     */
    event?: TEvent;
    /**
     * Handler for the tool.
     */
    handler: ToolHandler<
        ValueFromOptions<TInput>,
        s.Infer<TOutput>,
        ValueFromOptions<TState>,
        ValueFromSchema<TEvent>
    >;
};

/**
 * Tool definition.
 */
export type ToolDefinition<
    TInput extends ObjectSchema = ObjectSchema,
    TOutput extends s.Schema = s.SchemaAny,
    TState extends ObjectSchema = ObjectSchema,
    TEvent extends s.Schema | undefined = s.Schema | undefined,
> = {
    /**
     * Description of the tool.
     * Should be descriptive and concise, so that LLM can understand what the tool does.
     */
    description?: string | string[];
    /**
     * Arguments for the tool.
     */
    input: TInput;
    /**
     * Whether the tool has a single argument.
     */
    singleArg: boolean;
    /**
     * Schema of the return value of the tool.
     */
    output: TOutput;
    /**
     * Schema of the state of the tool.
     */
    state: TState;
    /**
     * Schema of the event of the tool.
     */
    event: TEvent;
    /**
     * Handler for the tool.
     */
    handler: ToolHandler<
        ValueFromSchema<TInput>,
        s.Infer<TOutput>,
        ValueFromSchema<TState>,
        ValueFromSchema<TEvent>
    >;
    /**
     * Symbol to indicate that the value is a tool.
     * @internal
     */
    [TOOL_SYMBOL]: true;
};

/**
 * Event of the tool.
 */
export type ToolEvent<T = unknown> = {
    /**
     * Timestamp of the event.
     */
    readonly timestamp: Date;
    /**
     * Payload of the event.
     */
    readonly payload: T;
    /**
     * Whether the event has been processed.
     */
    processed: boolean;
};

/**
 * Parameters for the tool handler.
 */
export type ToolContext<TInput, TOutput, TState, TEvent> = {
    /**
     * Resolved arguments for the tool.
     * First you need to define the input schema in {@link defineTool} options.
     */
    input: TInput;
    /**
     * State of the tool.
     */
    state: TState;
    /**
     * Events to be processed.
     * If provided, the tool was interacted with.
     * Otherwise, the tool executed for the first time.
     */
    events: ToolEvent<TEvent>[];
    /**
     * Trace of the tool execution within the agent.
     */
    trace: string;
    /**
     * Agent instance.
     */
    agent: Agent;
    /**
     * Helper for the tool result.
     */
    result: ToolResultHelper<TOutput>;
};

/**
 * Handler for the tool.
 */
export type ToolHandler<TInput, TOutput, TState, TEvent> = (
    ctx: ToolContext<TInput, TOutput, TState, TEvent>,
) => ToolResult<TOutput> | Promise<ToolResult<TOutput>>;

/**
 * Define a tool.
 * @param options - Options for the tool.
 * @returns Defined tool.
 */
export function defineTool<
    TInput extends ObjectOptions = undefined,
    TOutput extends s.Schema = s.VoidSchema,
    TState extends ObjectOptions = undefined,
    TEvent extends s.Schema | undefined = undefined,
>(options: ToolOptions<TInput, TOutput, TState, TEvent>) {
    type Tool = ToolDefinition<
        SchemaFromOptions<TInput>,
        TOutput,
        SchemaFromOptions<TState>,
        TEvent
    >;

    let input: SchemaFromOptions<TInput>;
    let singleArg = false;

    if (!options.input) {
        input = undefined as Tool['input'];
    } else if (s.isSchema(options.input, s.object)) {
        if (options.input.nullable || options.input.optional) {
            throw new Error('Input schema must not be nullable or optional');
        }

        input = options.input as Tool['input'];
        // if a full schema is provided, we assume it's a single argument
        singleArg = true;
    } else {
        input = s.object({ props: options.input }) as Tool['input'];
        // make the tool singleArg if there are more than 2 arguments
        singleArg = Object.keys(options.input).length > 2;
    }

    let state: Tool['state'];
    if (!options.state) {
        state = undefined as Tool['state'];
    } else if (s.isSchema(options.state, s.object)) {
        if (options.state.nullable || options.state.optional) {
            throw new Error('State schema must not be nullable or optional');
        }

        state = options.state as Tool['state'];
    } else {
        state = s.object({ props: options.state }) as Tool['state'];
    }

    const tool: Tool = {
        description: options.description,
        input,
        singleArg,
        output: options.output ?? (s.void() as Tool['output']),
        state,
        event: options.event as Tool['event'],
        handler: options.handler as Tool['handler'],
        [TOOL_SYMBOL]: true,
    };

    return tool;
}

/**
 * Check if a value is a tool.
 * @param value - Value to check.
 * @returns Whether the value is a tool.
 */
export function isTool(value: unknown): value is ToolDefinition {
    return typeof value === 'object' && value !== null && TOOL_SYMBOL in value;
}
