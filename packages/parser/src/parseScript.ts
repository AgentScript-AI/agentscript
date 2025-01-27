import { parse } from '@babel/parser';
import type * as babel from '@babel/types';

import { ParseError } from './ParseError.js';
import type {
    ArrayExpression,
    AssignmentExpression,
    AstNode,
    Expression,
    Literal,
    ObjectExpression,
    ObjectProperty,
    OperatorExpression,
    Script,
    TemplateLiteral,
} from './astTypes.js';

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
    let node: AstNode;

    switch (statement.type) {
        case 'VariableDeclaration': {
            const declaration = statement.declarations[0];
            if (declaration.id.type !== 'Identifier') {
                throw new ParseError('Invalid variable declaration', {
                    cause: statement,
                });
            }

            node = {
                type: 'var',
                name: declaration.id.name,
                value: declaration.init ? parseExpression(declaration.init) : undefined,
            };

            break;
        }

        case 'ExpressionStatement': {
            node = parseExpression(statement.expression);
            break;
        }

        case 'BlockStatement': {
            node = {
                type: 'block',
                body: statement.body.map(parseStatement),
            };
            break;
        }

        case 'IfStatement': {
            node = {
                type: 'if',
                if: parseExpression(statement.test),
                then: parseStatement(statement.consequent),
                else: statement.alternate ? parseStatement(statement.alternate) : undefined,
            };
            break;
        }

        case 'ReturnStatement': {
            node = {
                type: 'return',
                value: statement.argument ? parseExpression(statement.argument) : undefined,
            };
            break;
        }

        default:
            throw new ParseError(`Unknown statement type: ${statement.type}`, {
                cause: statement,
            });
    }

    const comment = parseComment(statement.leadingComments);
    if (comment) {
        node.comment = comment;
    }

    return node;
}

function parseExpression(expression: babel.Expression): Expression {
    switch (expression.type) {
        case 'Identifier':
            if (expression.name === 'undefined') {
                return {
                    type: 'literal',
                    value: undefined,
                };
            }

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
                args: parseArguments(expression.arguments),
            };
        }

        case 'AssignmentExpression':
            return {
                type: 'assign',
                left: parseLeftValue(expression.left as babel.LVal),
                right: parseExpression(expression.right),
            };

        case 'ObjectExpression':
            return parseObjectExpression(expression);

        case 'ArrayExpression':
            return parseArrayExpression(expression);

        case 'NewExpression':
            return {
                type: 'new',
                func: parseExpression(expression.callee as babel.Expression),
                args: parseArguments(expression.arguments),
            };

        case 'TemplateLiteral':
            return parseTemplateLiteral(expression);

        case 'BinaryExpression':
        case 'LogicalExpression':
            return {
                type: 'operator',
                operator: expression.operator as OperatorExpression['operator'],
                left: parseExpression(expression.left as babel.Expression),
                right: parseExpression(expression.right),
            };

        case 'ArrowFunctionExpression':
            return {
                type: 'arrowfn',
                params: expression.params.map(p => {
                    const param = parseExpression(p as babel.Expression);

                    if (param.type !== 'ident') {
                        throw new ParseError('Invalid arrow function parameter', {
                            cause: p,
                        });
                    }

                    return param;
                }),
                body:
                    expression.body.type === 'BlockStatement'
                        ? parseStatement(expression.body)
                        : parseExpression(expression.body),
            };

        case 'ConditionalExpression':
            return {
                type: 'ternary',
                if: parseExpression(expression.test),
                then: parseExpression(expression.consequent),
                else: parseExpression(expression.alternate),
            };
    }

    throw new ParseError(`Unknown expression type: ${expression.type}`, {
        cause: expression,
    });
}

function parseObjectExpression(expression: babel.ObjectExpression): ObjectExpression | Literal {
    const props = expression.properties.map(prop =>
        parseObjectProperty(prop as babel.ObjectProperty),
    );

    if (
        props.every(
            prop =>
                prop.value.type === 'literal' &&
                (prop.key.type === 'ident' || prop.key.type === 'literal'),
        )
    ) {
        const value: Record<string, unknown> = {};
        for (const prop of props) {
            if (prop.key.type === 'ident') {
                value[prop.key.name] = (prop.value as Literal).value;
            } else {
                value[(prop.key as Literal).value as string] = (prop.value as Literal).value;
            }
        }

        return {
            type: 'literal',
            value,
        };
    }

    return {
        type: 'object',
        props,
    };
}

function parseArrayExpression(expression: babel.ArrayExpression): ArrayExpression | Literal {
    const items = expression.elements.map<Expression>(e => {
        if (e === null) {
            return { type: 'literal', value: null };
        }

        return parseArgument(e);
    });

    if (items.every(item => item.type === 'literal')) {
        return {
            type: 'literal',
            value: items.map(item => item.value),
        };
    }

    return {
        type: 'array',
        items,
    };
}

function parseTemplateLiteral(expression: babel.TemplateLiteral): TemplateLiteral {
    const parts: TemplateLiteral['parts'] = [];

    for (let i = 0; i < expression.quasis.length + expression.expressions.length; i++) {
        if (i % 2 === 0) {
            const part = expression.quasis[i / 2].value.raw;
            if (!part) {
                continue;
            }

            parts.push(part);
        } else {
            const expr = expression.expressions[Math.floor(i / 2)];
            parts.push(parseExpression(expr as babel.Expression));
        }
    }

    return {
        type: 'template',
        parts,
    };
}

function parseLeftValue(left: babel.LVal): AssignmentExpression['left'] {
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

type Argument = babel.Expression | babel.SpreadElement | babel.ArgumentPlaceholder;

function parseArguments(args: Argument[]) {
    const result = args.map(arg => parseArgument(arg));

    if (result.length === 0) {
        return undefined;
    }

    return result;
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
