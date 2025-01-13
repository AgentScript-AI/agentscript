/**
 * Error thrown when parsing fails.
 */
export class ParseError extends Error {
    /**
     * @param message - Error message.
     * @param options - Error options.
     */
    constructor(message: string, options: ErrorOptions) {
        super(message, options);
    }
}
