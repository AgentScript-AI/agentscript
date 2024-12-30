export interface StatementBase {
    type: string;
    comment?: string;
}

export interface VariableDeclaration extends StatementBase {
    type: 'Variable';
    name: string;
    value?: Expression | undefined;
}

export interface ExpressionStatement extends StatementBase {
    type: 'Expression';
    expression: Expression;
}

export interface ExpressionBase {
    type: string;
    comment?: string;
}

export interface FunctionCall extends ExpressionBase {
    type: 'FunctionCall';
    func: Expression;
    arguments: Expression[];
}

export interface Literal extends ExpressionBase {
    type: 'Literal';
    value: unknown;
}

export interface Identifier extends ExpressionBase {
    type: 'Identifier';
    name: string;
}

export interface Member extends ExpressionBase {
    type: 'Member';
    property: Expression;
    object: Expression;
}

export interface Assignment extends ExpressionBase {
    type: 'Assignment';
    left: Expression;
    right: Expression;
}

export interface ObjectExpression extends ExpressionBase {
    type: 'Object';
    props: ObjectProperty[];
}

export interface ObjectProperty {
    key: Expression;
    value: Expression;
}

export type Expression =
    | FunctionCall
    | Literal
    | Identifier
    | Member
    | Assignment
    | ObjectExpression;

export type Statement = VariableDeclaration | ExpressionStatement;
export type Node = Statement | Expression;
export type Script = Statement[];
