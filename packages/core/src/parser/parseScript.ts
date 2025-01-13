import { parse } from '@babel/parser';
import type * as babel from '@babel/types';

import { ParseError } from './ParseError.js';
import type { Assignment, AstNode, Expression, ObjectProperty, Script } from './astTypes.js';

/**
 * Parse a script into an AST.
 * @param code - Script to parse.
 * @returns AST.
 */
export function parseScript(code: string | string[]): Script {
    if (Array.isArray(code)) {
        code = code.join('\n');
    }

    const ast = parse(code);
    const parsed: AstNode[] = [];

    for (const node of ast.program.body) {
        parsed.push(parseStatement(node));
    }

    return {
        code,
        ast: parsed,
    };
}

function parseStatement(statement: babel.Statement): AstNode {
    const comment = parseComment(statement.leadingComments);

    switch (statement.type) {
        case 'VariableDeclaration': {
            const declaration = statement.declarations[0];
            if (declaration.id.type !== 'Identifier') {
                throw new ParseError('Invalid variable declaration', {
                    cause: statement,
                });
            }

            return {
                type: 'var',
                name: declaration.id.name,
                value: declaration.init ? parseExpression(declaration.init) : undefined,
                comment,
            };
        }

        case 'ExpressionStatement': {
            const expr = parseExpression(statement.expression);
            expr.comment = comment;
            return expr;
        }
    }

    throw new ParseError(`Unknown statement type: ${statement.type}`, {
        cause: statement,
    });
}

function parseExpression(expression: babel.Expression): Expression {
    switch (expression.type) {
        case 'Identifier':
            return {
                type: 'ident',
                name: expression.name,
            };

        case 'NullLiteral':
            return {
                type: 'literal',
                value: null,
            };

        case 'StringLiteral':
        case 'BooleanLiteral':
        case 'NumericLiteral':
            return {
                type: 'literal',
                value: expression.value,
            };

        case 'UnaryExpression':
            if (expression.operator === '-' && expression.argument.type === 'NumericLiteral') {
                return {
                    type: 'literal',
                    value: -expression.argument.value,
                };
            }

            break;

        case 'MemberExpression':
            return {
                type: 'member',
                prop: parseExpression(expression.property as babel.Expression),
                obj: parseExpression(expression.object),
            };

        case 'CallExpression': {
            return {
                type: 'call',
                func: parseExpression(expression.callee as babel.Expression),
                args: expression.arguments.map(parseArgument),
            };
        }

        case 'AssignmentExpression': {
            return {
                type: 'assign',
                left: parseLeftValue(expression.left as babel.LVal),
                right: parseExpression(expression.right),
            };
        }

        case 'ObjectExpression':
            return {
                type: 'obj',
                props: expression.properties.map(prop =>
                    parseObjectProperty(prop as babel.ObjectProperty),
                ),
            };

        case 'ArrayExpression':
            return {
                type: 'arr',
                items: expression.elements.map(e => {
                    if (e === null) {
                        return { type: 'literal', value: null };
                    }

                    return parseArgument(e);
                }),
            };

        case 'NewExpression': {
            return {
                type: 'new',
                func: parseExpression(expression.callee as babel.Expression),
                args: expression.arguments.map(parseArgument),
            };
        }
    }

    throw new ParseError(`Unknown expression type: ${expression.type}`, {
        cause: expression,
    });
}

function parseLeftValue(left: babel.LVal): Assignment['left'] {
    const expression = parseExpression(left as babel.Expression);

    switch (expression.type) {
        case 'ident':
        case 'member':
            return expression;
    }

    throw new ParseError(`Invalid left value: ${expression.type}`, {
        cause: expression,
    });
}

function parseComment(comments: babel.Comment[] | undefined | null): string | undefined {
    if (!comments) {
        return undefined;
    }

    return comments.map(c => c.value.trim()).join('\n');
}

function parseObjectProperty(property: babel.ObjectProperty): ObjectProperty {
    return {
        key: parseExpression(property.key as babel.Expression),
        value: parseExpression(property.value as babel.Expression),
    };
}

function parseArgument(
    arg: babel.Expression | babel.SpreadElement | babel.ArgumentPlaceholder,
): Expression {
    if (arg.type === 'SpreadElement') {
        // TODO: Implement spread elements
        throw new ParseError('Spread element not supported', {
            cause: arg,
        });
    }

    if (arg.type === 'ArgumentPlaceholder') {
        // TODO: Implement argument placeholders
        throw new ParseError('Argument placeholder not supported', {
            cause: arg,
        });
    }

    return parseExpression(arg);
}
