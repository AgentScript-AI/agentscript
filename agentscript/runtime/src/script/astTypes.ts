export interface StatementBase {
    type: string;
    comment?: string;
}

export interface VariableDeclaration extends StatementBase {
    type: 'VariableDeclaration';
    name: string;
    value?: Expression | undefined;
}

export interface ExpressionStatement extends StatementBase {
    type: 'ExpressionStatement';
    expression: Expression;
}

export interface ExpressionBase {
    type: string;
    comment?: string;
}

export interface FunctionCall extends ExpressionBase {
    type: 'FunctionCall';
    name: string;
    arguments: Expression[];
}

export interface Literal extends ExpressionBase {
    type: 'Literal';
    value: unknown;
}

export interface Variable extends ExpressionBase {
    type: 'Variable';
    name: string;
}

export interface Assignment extends ExpressionBase {
    type: 'Assignment';
    left: Expression;
    right: Expression;
}

export type Expression = FunctionCall | Literal | Variable | Assignment;

export type Statement = VariableDeclaration | ExpressionStatement;
export type Node = Statement | Expression;
export type Script = Statement[];
