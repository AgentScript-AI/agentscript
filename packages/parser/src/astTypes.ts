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
 * Block statement.
 */
export interface BlockStatement extends AstNodeBase {
    /**
     * Type of the statement.
     */
    type: 'block';
    /**
     * Statements in the block.
     */
    body: AstNode[];
}

/**
 * Return statement.
 */
export interface ReturnStatement extends AstNodeBase {
    /**
     * Type of the statement.
     */
    type: 'return';
    /**
     * Value to return.
     */
    value?: Expression;
}

/**
 * If statement.
 */
export interface IfStatement extends AstNodeBase {
    /**
     * Type of the statement.
     */
    type: 'if';
    /**
     * Condition of the if statement.
     */
    if: Expression;
    /**
     * Body of the if statement.
     */
    then: AstNode;
    /**
     * Else statement.
     */
    else?: AstNode;
}

/**
 * While statement.
 */
export interface WhileStatement extends AstNodeBase {
    /**
     * Type of the statement.
     */
    type: 'while';
    /**
     * Condition of the while statement.
     */
    if: Expression;
    /**
     * Body of the while statement.
     */
    body: AstNode;
}

/**
 * Break statement.
 */
export interface BreakStatement extends AstNodeBase {
    /**
     * Type of the statement.
     */
    type: 'break';
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
    args?: Expression[];
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
    args?: Expression[];
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
export interface IdentifierExpression extends AstNodeBase {
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
export interface AssignmentExpression extends AstNodeBase {
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
 * Operator expression.
 */
export interface BinaryExpression extends AstNodeBase {
    /**
     * Type of the expression.
     */
    type: 'binary';
    /**
     * Operator.
     */
    operator: '+' | '-' | '*' | '/' | '%' | '==' | '===' | '!=' | '!==' | '>' | '<' | '>=' | '<=';
    /**
     * Left side of the operator.
     */
    left: Expression;
    /**
     * Right side of the operator.
     */
    right: Expression;
}

/**
 * Logical expression.
 */
export interface LogicalExpression extends AstNodeBase {
    /**
     * Type of the expression.
     */
    type: 'logical';
    /**
     * Operator.
     */
    operator: '&&' | '||' | '??';
    /**
     * Left side of the operator.
     */
    left: Expression;
    /**
     * Right side of the operator.
     */
    right: Expression;
}

/**
 * Unary expression.
 */
export interface UnaryExpression extends AstNodeBase {
    /**
     * Type of the expression.
     */
    type: 'unary';
    /**
     * Operator.
     */
    operator: '+' | '-' | '!' | 'typeof';
    /**
     * Expression to apply the operator to.
     */
    expr: Expression;
}

/**
 * Update expression.
 */
export interface UpdateExpression extends AstNodeBase {
    /**
     * Type of the expression.
     */
    type: 'update';
    /**
     * Operator.
     */
    operator: '++' | '--';
    /**
     * Expression to update.
     */
    expr: Expression;
    /**
     * Whether the update is prefix or postfix.
     */
    pre: boolean;
}

/**
 * Object expression.
 */
export interface ObjectExpression extends AstNodeBase {
    /**
     * Type of the expression.
     */
    type: 'object';
    /**
     * Properties of the object.
     */
    props: ObjectProperty[];
}

/**
 * Object property.
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
 * Array expression.
 */
export interface ArrayExpression extends AstNodeBase {
    /**
     * Type of the expression.
     */
    type: 'array';
    /**
     * Items in the array.
     */
    items: Expression[];
}

/**
 * Arrow function expression.
 */
export interface ArrowFunctionExpression extends AstNodeBase {
    /**
     * Type of the expression.
     */
    type: 'arrowfn';
    /**
     * Parameters of the function.
     */
    params: IdentifierExpression[];
    /**
     * Body of the function.
     */
    body: AstNode;
}

/**
 * Template literal expression.
 */
export interface TemplateLiteral extends AstNodeBase {
    /**
     * Type of the expression.
     */
    type: 'template';
    /**
     * Parts of the template literal.
     */
    parts: (Expression | string)[];
}

/**
 * Ternary expression.
 */
export interface TernaryExpression extends AstNodeBase {
    /**
     * Type of the expression.
     */
    type: 'ternary';
    /**
     * Condition of the ternary expression.
     */
    if: Expression;
    /**
     * Then part of the ternary expression.
     */
    then: Expression;
    /**
     * Else part of the ternary expression.
     */
    else: Expression;
}

/**
 * Expression.
 */
export type Expression =
    | FunctionCall
    | Literal
    | IdentifierExpression
    | MemberExpression
    | AssignmentExpression
    | ObjectExpression
    | ArrayExpression
    | NewExpression
    | BinaryExpression
    | LogicalExpression
    | UnaryExpression
    | ArrowFunctionExpression
    | TemplateLiteral
    | TernaryExpression
    | UpdateExpression;

/**
 * Script statement.
 */
export type Statement =
    | VariableDeclaration
    | BlockStatement
    | ReturnStatement
    | IfStatement
    | WhileStatement
    | BreakStatement;

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
    code: string;
    /**
     * AST of the script.
     */
    ast: AstNode[];
}
