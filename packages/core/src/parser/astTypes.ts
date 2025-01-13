/**
 * Base interface for all statements.
 */
export interface AstNodeBase {
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
export interface VariableDeclaration extends AstNodeBase {
    /**
     * Type of the statement.
     */
    type: 'var';
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
 * Function call expression.
 */
export interface FunctionCall extends AstNodeBase {
    /**
     * Type of the expression.
     */
    type: 'call';
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
export interface NewExpression extends AstNodeBase {
    /**
     * Type of the expression.
     */
    type: 'new';
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
export interface Literal extends AstNodeBase {
    /**
     * Type of the expression.
     */
    type: 'literal';
    /**
     * Value of the literal.
     */
    value: unknown;
}

/**
 * Identifier expression.
 */
export interface Identifier extends AstNodeBase {
    /**
     * Type of the expression.
     */
    type: 'ident';
    /**
     * Name of the identifier.
     */
    name: string;
}

/**
 * Member expression.
 */
export interface MemberExpression extends AstNodeBase {
    /**
     * Type of the expression.
     */
    type: 'member';
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
export interface Assignment extends AstNodeBase {
    /**
     * Type of the expression.
     */
    type: 'assign';
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
export interface ObjectExpression extends AstNodeBase {
    /**
     * Type of the expression.
     */
    type: 'obj';
    /**
     * Properties of the object.
     */
    props: ObjectProperty[];
}

/**
 *
 */
export interface ArrayExpression extends AstNodeBase {
    /**
     * Type of the expression.
     */
    type: 'arr';
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
export type Statement = VariableDeclaration;

/**
 * AST node.
 */
export type AstNode = Statement | Expression;

/**
 * Script object.
 */
export interface Script {
    /**
     * Code of the script.
     */
    code?: string;
    /**
     * AST of the script.
     */
    ast: AstNode[];
}
