import { ParseError } from './ParseError.js';

const RESPONSE_WRAPPED_REGEX = /^([\s\S]*)```(\w*)?\n([\s\S]*)\n```/m;
const RESPONSE_UNWRAPPED_REGEX = /^([\s\S]*?)\n(\/\/[\s\S]*)/m;

/**
 * Parse the response from the LLM into a plan and code.
 * @param response - Response from the LLM.
 * @returns Plan and code.
 */
export function parseCodeResponse(response: string) {
    let match = response.match(RESPONSE_WRAPPED_REGEX);
    if (match) {
        return {
            plan: match[1].trim(),
            code: match[3].trim(),
        };
    }

    match = response.match(RESPONSE_UNWRAPPED_REGEX);
    if (match) {
        return {
            plan: match[1].trim(),
            code: match[2].trim(),
        };
    }

    throw new ParseError('No code found in response', {
        cause: response,
    });
}
