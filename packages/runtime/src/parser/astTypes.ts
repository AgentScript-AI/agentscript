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
    expr: Expression;
}

export interface ExpressionBase {
    type: string;
    comment?: string;
}

export interface FunctionCall extends ExpressionBase {
    type: 'FunctionCall';
    func: Expression;
    args: Expression[];
}

export interface NewExpression extends ExpressionBase {
    type: 'New';
    func: Expression;
    args: Expression[];
}

export interface Literal extends ExpressionBase {
    type: 'Literal';
    value: unknown;
}

export interface Identifier extends ExpressionBase {
    type: 'Identifier';
    name: string;
}

export interface MemberExpression extends ExpressionBase {
    type: 'Member';
    prop: Expression;
    obj: Expression;
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

export interface ArrayExpression extends ExpressionBase {
    type: 'Array';
    items: Expression[];
}

export interface ObjectProperty {
    key: Expression;
    value: Expression;
}

export type Expression =
    | FunctionCall
    | Literal
    | Identifier
    | MemberExpression
    | Assignment
    | ObjectExpression
    | ArrayExpression
    | NewExpression;

export type Statement = VariableDeclaration | ExpressionStatement;
export type Node = Statement | Expression;
export type Script = Statement[];
