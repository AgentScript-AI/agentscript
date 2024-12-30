import { parse } from '@babel/parser';
import type * as babel from '@babel/types';

import type { Assignment, Expression, Script, Statement } from './astTypes.js';

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
                expression: parseExpression(statement.expression),
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
                property: parseExpression(expression.property as babel.Expression),
                object: parseExpression(expression.object),
            };

        case 'AssignmentExpression': {
            return {
                type: 'Assignment',
                left: parseLeftValue(expression.left as babel.LVal),
                right: parseExpression(expression.right),
            };
        }

        case 'CallExpression': {
            return {
                type: 'FunctionCall',
                func: parseExpression(expression.callee as babel.Expression),
                arguments: expression.arguments.map(e => {
                    if (e.type === 'SpreadElement') {
                        // TODO: Implement spread elements
                        throw new Error('Spread element not supported');
                    }

                    if (e.type === 'ArgumentPlaceholder') {
                        // TODO: Implement argument placeholders
                        throw new Error('Argument placeholder not supported');
                    }

                    return parseExpression(e);
                }),
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
