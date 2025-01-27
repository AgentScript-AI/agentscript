/**
 * Error thrown when an error occurs during runtime.
 */
export class RuntimeError extends Error {
    /**
     * @param message - Error message.
     * @param options - Error options.
     */
    constructor(message: string, options?: ErrorOptions) {
        super(message, options);
        this.name = 'RuntimeError';
    }
}
