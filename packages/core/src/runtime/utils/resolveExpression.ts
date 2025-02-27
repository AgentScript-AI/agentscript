import type { Expression, IdentifierExpression, Literal } from '@agentscript-ai/parser';

import type { Agent } from '../../agent/agentTypes.js';
import { RuntimeError } from '../RuntimeError.js';
import { ALLOWED_GLOBALS } from '../common.js';
import type { StackFrame } from '../runtimeTypes.js';

/**
 * Resolve an expression.
 * @param agent - Agent to resolve the expression for.
 * @param frame - Frame to resolve the expression in.
 * @param expression - Expression to resolve.
 * @returns Resolved expression.
 */
export function resolveExpression(
    agent: Agent,
    frame: StackFrame,
    expression: Expression,
): unknown {
    switch (expression.type) {
        case 'ident': {
            return resolveIdentifier(agent, frame, expression);
        }

        case 'literal': {
            return resolveLiteral(expression);
        }

        case 'member': {
            const object = resolveExpression(agent, frame, expression.obj);
            const property =
                typeof expression.prop === 'string'
                    ? expression.prop
                    : resolveName(agent, frame, expression.prop);

            return (object as Record<string, unknown>)[property];
        }

        default:
            throw new RuntimeError(`Unsupported expression type: ${expression.type}`);
    }
}

/**
 * Resolve an expression as name.
 * @param agent - Agent to resolve the expression for.
 * @param frame - Frame to resolve the expression in.
 * @param expression - Expression to resolve.
 * @returns Resolved name.
 */
export function resolveName(agent: Agent, frame: StackFrame, expression: Expression) {
    if (expression.type === 'ident') {
        return expression.name;
    }

    return resolveExpression(agent, frame, expression) as string;
}

/**
 * Resolve an identifier.
 * @param agent - Agent to resolve the identifier for.
 * @param frame - Frame to resolve the identifier in.
 * @param expression - Identifier to resolve.
 * @returns Resolved identifier.
 */
export function resolveIdentifier(
    agent: Agent,
    frame: StackFrame,
    expression: IdentifierExpression,
) {
    const name = expression.name;
    if (name === 'undefined') {
        return undefined;
    }

    while (frame) {
        const variables = frame.variables;
        if (variables && name in variables) {
            return variables[name];
        }

        if (frame.parent) {
            frame = frame.parent;
            continue;
        }

        break;
    }

    const tools = agent.def.tools;
    if (tools && name in tools) {
        return tools[name];
    }

    if (ALLOWED_GLOBALS.has(name)) {
        return (globalThis as Record<string, unknown>)[name];
    }

    throw new RuntimeError(`Variable ${expression.name} not found`);
}

/**
 * Resolve a literal.
 * @param expression - Literal to resolve.
 * @returns Resolved literal.
 */
export function resolveLiteral(expression: Literal) {
    const value = expression.value;
    if (!value) {
        return value;
    }

    if (typeof value === 'object') {
        return JSON.parse(JSON.stringify(value)) as unknown;
    }

    return value;
}
