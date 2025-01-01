/**
 * Base interface for all statements.
 */
export interface StatementBase {
    /**
     * Type of the statement.
     */
    type: string;
    /**
     * Comment for the statement.
     */
    comment?: string;
}

/**
 * Variable declaration statement.
 */
export interface VariableDeclaration extends StatementBase {
    /**
     * Type of the statement.
     */
    type: 'Variable';
    /**
     * Name of the variable.
     */
    name: string;
    /**
     * Value of the variable.
     */
    value?: Expression | undefined;
}

/**
 * Expression statement.
 */
export interface ExpressionStatement extends StatementBase {
    /**
     * Type of the statement.
     */
    type: 'Expression';
    /**
     * Expression to evaluate.
     */
    expr: Expression;
}

/**
 * Base interface for all expressions.
 */
export interface ExpressionBase {
    /**
     * Type of the expression.
     */
    type: string;
    /**
     * Comment for the expression.
     */
    comment?: string;
}

/**
 * Function call expression.
 */
export interface FunctionCall extends ExpressionBase {
    /**
     * Type of the expression.
     */
    type: 'FunctionCall';
    /**
     * Function to call.
     */
    func: Expression;
    /**
     * Arguments to pass to the function.
     */
    args: Expression[];
}

/**
 * New expression.
 */
export interface NewExpression extends ExpressionBase {
    /**
     * Type of the expression.
     */
    type: 'New';
    /**
     * Function to call.
     */
    func: Expression;
    /**
     * Arguments to pass to the constructor.
     */
    args: Expression[];
}

/**
 * Literal expression.
 */
export interface Literal extends ExpressionBase {
    /**
     * Type of the expression.
     */
    type: 'Literal';
    /**
     * Value of the literal.
     */
    value: unknown;
}

/**
 * Identifier expression.
 */
export interface Identifier extends ExpressionBase {
    /**
     * Type of the expression.
     */
    type: 'Identifier';
    /**
     * Name of the identifier.
     */
    name: string;
}

/**
 * Member expression.
 */
export interface MemberExpression extends ExpressionBase {
    /**
     * Type of the expression.
     */
    type: 'Member';
    /**
     * Property to access.
     */
    prop: Expression;
    /**
     * Object to access the property on.
     */
    obj: Expression;
}

/**
 * Assignment expression.
 */
export interface Assignment extends ExpressionBase {
    /**
     * Type of the expression.
     */
    type: 'Assignment';
    /**
     * Left side of the assignment.
     */
    left: Expression;
    /**
     * Right side of the assignment.
     */
    right: Expression;
}

/**
 * Object expression.
 */
export interface ObjectExpression extends ExpressionBase {
    /**
     * Type of the expression.
     */
    type: 'Object';
    /**
     * Properties of the object.
     */
    props: ObjectProperty[];
}

/**
 *
 */
export interface ArrayExpression extends ExpressionBase {
    /**
     * Type of the expression.
     */
    type: 'Array';
    /**
     * Items in the array.
     */
    items: Expression[];
}

/**
 *
 */
export interface ObjectProperty {
    /**
     * Key of the property.
     */
    key: Expression;
    /**
     * Value of the property.
     */
    value: Expression;
}

/**
 * Expression.
 */
export type Expression =
    | FunctionCall
    | Literal
    | Identifier
    | MemberExpression
    | Assignment
    | ObjectExpression
    | ArrayExpression
    | NewExpression;

/**
 * Script statement.
 */
export type Statement = VariableDeclaration | ExpressionStatement;

/**
 * Script AST.
 */
export type Script = Statement[];
