/**
 * Symbol to indicate that the tool is waiting for events.
 */
export const TOOL_AWAIT_RESULT = Symbol('toolAwait');

/**
 * Helper for the tool result.
 */
export const toolResultHelper: ToolResultHelper = Object.assign((output: unknown) => output, {
    await: () => TOOL_AWAIT_RESULT,
});

/**
 * Special tool result type to indicate that the tool is waiting for events.
 */
export type ToolAwaitResult = typeof TOOL_AWAIT_RESULT;

/**
 * Helper type for the tool result.
 */
export type ToolResultHelper<TOutput = unknown> = {
    /**
     * Helper function to return the output.
     * Makes it easier to proprly type the output of the tool.
     * @param output - Output to return.
     * @returns Output.
     */
    (output: TOutput): TOutput;
    /**
     * Marks the tool as waiting for events.
     */
    await(): ToolAwaitResult;
};

/**
 * Result of the tool.
 */
export type ToolResult<TOutput> = TOutput | ToolAwaitResult;
