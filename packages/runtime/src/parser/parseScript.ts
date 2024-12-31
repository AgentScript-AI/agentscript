import { parse } from '@babel/parser';
import type * as babel from '@babel/types';

import type { Assignment, Expression, ObjectProperty, Script, Statement } from './astTypes.js';

export function parseScript(script: string | string[]): Script {
    if (Array.isArray(script)) {
        script = script.join('\n');
    }

    const ast = parse(script);
    const result: Script = [];

    for (const node of ast.program.body) {
        result.push(parseStatement(node as babel.Statement));
    }

    return result;
}

function parseStatement(statement: babel.Statement): Statement {
    const comment = parseComment(statement.leadingComments);

    switch (statement.type) {
        case 'VariableDeclaration': {
            const declaration = statement.declarations[0];
            if (declaration.id.type !== 'Identifier') {
                throw new Error('Invalid variable declaration');
            }

            return {
                type: 'Variable',
                name: declaration.id.name,
                value: declaration.init ? parseExpression(declaration.init) : undefined,
                comment,
            };
        }

        case 'ExpressionStatement': {
            return {
                type: 'Expression',
                expr: parseExpression(statement.expression),
                comment,
            };
        }
    }

    throw new Error(`Unknown statement type: ${statement.type}`);
}

function parseExpression(expression: babel.Expression): Expression {
    switch (expression.type) {
        case 'NullLiteral':
            return {
                type: 'Literal',
                value: null,
            };

        case 'StringLiteral':
        case 'BooleanLiteral':
        case 'NumericLiteral':
            return {
                type: 'Literal',
                value: expression.value,
            };

        case 'Identifier':
            return {
                type: 'Identifier',
                name: expression.name,
            };

        case 'MemberExpression':
            return {
                type: 'Member',
                prop: parseExpression(expression.property as babel.Expression),
                obj: parseExpression(expression.object),
            };

        case 'CallExpression': {
            return {
                type: 'FunctionCall',
                func: parseExpression(expression.callee as babel.Expression),
                args: expression.arguments.map(parseArgument),
            };
        }

        case 'AssignmentExpression': {
            return {
                type: 'Assignment',
                left: parseLeftValue(expression.left as babel.LVal),
                right: parseExpression(expression.right),
            };
        }

        case 'ObjectExpression':
            return {
                type: 'Object',
                props: expression.properties.map(prop =>
                    parseObjectProperty(prop as babel.ObjectProperty),
                ),
            };

        case 'ArrayExpression':
            return {
                type: 'Array',
                items: expression.elements.map(e => {
                    if (e === null) {
                        return { type: 'Literal', value: null };
                    }

                    return parseArgument(e);
                }),
            };

        case 'NewExpression': {
            return {
                type: 'New',
                func: parseExpression(expression.callee as babel.Expression),
                args: expression.arguments.map(parseArgument),
            };
        }
    }

    throw new Error(`Unknown expression type: ${expression.type}`);
}

function parseLeftValue(left: babel.LVal): Assignment['left'] {
    const expression = parseExpression(left as babel.Expression);

    switch (expression.type) {
        case 'Identifier':
        case 'Member':
            return expression;
    }

    throw new Error(`Invalid left value: ${expression.type}`);
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
        throw new Error('Spread element not supported');
    }

    if (arg.type === 'ArgumentPlaceholder') {
        // TODO: Implement argument placeholders
        throw new Error('Argument placeholder not supported');
    }

    return parseExpression(arg);
}
