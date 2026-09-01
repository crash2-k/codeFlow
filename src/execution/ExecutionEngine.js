/**
 * ExecutionEngine - Execute AST and generate execution states
 * This simulates JavaScript execution step-by-step
 */
export class ExecutionEngine {
    constructor(ast, functions) {
        this.ast = ast;
        this.functions = functions;
        this.states = [];
        this.currentState = null;
        this.globalScope = new Map();
        this.callStack = [];
        this.output = [];
        this.stepCounter = 0;
    }

    /**
     * Execute the program and generate all execution states
     */
    execute() {
        try {
            this.output = [];
            this.states = [];
            this.globalScope = new Map();
            this.callStack = [];
            this.stepCounter = 0;

            // Create initial state
            this.createState('Program Start');

            // Execute main body
            if (this.ast && this.ast.body) {
                this.executeBlockStatement(this.ast.body, this.globalScope);
            }

            // Create final state
            this.createState('Program Finish');

            return {
                success: true,
                states: this.states,
                output: this.output,
                error: null
            };
        } catch (error) {
            return {
                success: false,
                states: this.states,
                output: this.output,
                error: {
                    message: error.message,
                    stack: error.stack
                }
            };
        }
    }

    /**
     * Create an execution state snapshot
     */
    createState(description) {
        this.stepCounter++;
        const state = {
            step: this.stepCounter,
            description: description,
            output: [...this.output],
            globalScope: this.scopeToObject(this.globalScope),
            callStack: this.callStack.map(frame => ({
                functionName: frame.name,
                location: frame.location,
                variables: this.scopeToObject(frame.scope)
            })),
            timestamp: Date.now()
        };
        this.states.push(state);
        return state;
    }

    /**
     * Convert scope map to plain object for display
     */
    scopeToObject(scope) {
        const obj = {};
        for (const [key, value] of scope) {
            obj[key] = this.valueToString(value);
        }
        return obj;
    }

    /**
     * Convert value to displayable string
     */
    valueToString(value) {
        if (value === null) return 'null';
        if (value === undefined) return 'undefined';
        if (typeof value === 'boolean') return value.toString();
        if (typeof value === 'string') {
            // Handle already stringified values
            if (value.startsWith('"') && value.endsWith('"')) {
                return value;
            }
            return `"${value}"`;
        }
        if (typeof value === 'number') return value.toString();
        if (Array.isArray(value)) {
            try {
                return `[${value.map(v => this.valueToString(v)).join(', ')}]`;
            } catch (e) {
                return '[Array]';
            }
        }
        if (typeof value === 'object') {
            try {
                const pairs = Object.entries(value).map(([k, v]) => `${k}: ${this.valueToString(v)}`);
                return `{ ${pairs.join(', ')} }`;
            } catch (e) {
                return '[Object]';
            }
        }
        if (typeof value === 'function') return '[Function]';
        return String(value);
    }

    /**
     * Execute a block of statements
     */
    executeBlockStatement(statements, scope) {
        for (const statement of statements) {
            if (statement.type === 'FunctionDeclaration') {
                scope.set(statement.name, this.createFunction(statement));
                this.createState(`Function declared: ${statement.name}`);
            } else if (statement.type === 'VariableDeclaration') {
                this.executeVariableDeclaration(statement, scope);
            } else if (statement.type === 'ExpressionStatement') {
                this.evaluateExpression(statement.expression, scope);
                this.createState(`Expression evaluated`);
            } else if (statement.type === 'IfStatement') {
                this.executeIfStatement(statement, scope);
            } else if (statement.type === 'ForStatement') {
                this.executeForStatement(statement, scope);
            } else if (statement.type === 'WhileStatement') {
                this.executeWhileStatement(statement, scope);
            } else if (statement.type === 'ReturnStatement') {
                const value = statement.argument ? this.evaluateExpression(statement.argument, scope) : undefined;
                this.createState(`Return: ${this.valueToString(value)}`);
                throw new ReturnValue(value);
            } else if (statement.type === 'BreakStatement') {
                throw new BreakException();
            } else if (statement.type === 'ContinueStatement') {
                throw new ContinueException();
            }
        }
    }

    /**
     * Execute variable declaration
     */
    executeVariableDeclaration(statement, scope) {
        for (const decl of statement.declarations) {
            let value = undefined;
            if (decl.init) {
                value = this.evaluateExpression(decl.init, scope);
            }
            scope.set(decl.name, value);
            this.createState(`Variable declared: ${decl.name} = ${this.valueToString(value)}`);
        }
    }

    /**
     * Execute if statement
     */
    executeIfStatement(statement, scope) {
        const test = this.evaluateExpression(statement.test, scope);
        this.createState(`If condition: ${this.valueToString(test)}`);

        if (test) {
            this.executeStatement(statement.consequent, scope);
        } else if (statement.alternate) {
            this.executeStatement(statement.alternate, scope);
        }
    }

    /**
     * Execute for statement
     */
    executeForStatement(statement, scope) {
        const loopScope = new Map(scope);

        if (statement.init) {
            if (statement.init.type === 'VariableDeclaration') {
                this.executeVariableDeclaration(statement.init, loopScope);
            } else {
                this.evaluateExpression(statement.init, loopScope);
                this.createState(`For loop init`);
            }
        }

        let iterations = 0;
        const maxIterations = 10000; // Prevent infinite loops

        while (iterations < maxIterations) {
            if (statement.test) {
                const test = this.evaluateExpression(statement.test, loopScope);
                this.createState(`For condition: ${this.valueToString(test)}`);
                if (!test) break;
            }

            try {
                this.executeStatement(statement.body, loopScope);
            } catch (e) {
                if (e instanceof BreakException) {
                    this.createState(`Break statement`);
                    break;
                } else if (e instanceof ContinueException) {
                    this.createState(`Continue statement`);
                } else {
                    throw e;
                }
            }

            if (statement.update) {
                this.evaluateExpression(statement.update, loopScope);
                this.createState(`For update`);
            }

            iterations++;
        }

        if (iterations >= maxIterations) {
            throw new Error('Loop exceeded maximum iterations');
        }
    }

    /**
     * Execute while statement
     */
    executeWhileStatement(statement, scope) {
        let iterations = 0;
        const maxIterations = 10000;

        while (iterations < maxIterations) {
            const test = this.evaluateExpression(statement.test, scope);
            this.createState(`While condition: ${this.valueToString(test)}`);

            if (!test) break;

            try {
                this.executeStatement(statement.body, scope);
            } catch (e) {
                if (e instanceof BreakException) {
                    this.createState(`Break statement`);
                    break;
                } else if (e instanceof ContinueException) {
                    this.createState(`Continue statement`);
                } else {
                    throw e;
                }
            }

            iterations++;
        }

        if (iterations >= maxIterations) {
            throw new Error('Loop exceeded maximum iterations');
        }
    }

    /**
     * Execute a single statement
     */
    executeStatement(stmt, scope) {
        if (stmt.type === 'BlockStatement') {
            this.executeBlockStatement(stmt.body, scope);
        } else if (stmt.type === 'ExpressionStatement') {
            this.evaluateExpression(stmt.expression, scope);
            this.createState(`Expression evaluated`);
        } else if (stmt.type === 'IfStatement') {
            this.executeIfStatement(stmt, scope);
        } else if (stmt.type === 'ForStatement') {
            this.executeForStatement(stmt, scope);
        } else if (stmt.type === 'WhileStatement') {
            this.executeWhileStatement(stmt, scope);
        } else if (stmt.type === 'ReturnStatement') {
            const value = stmt.argument ? this.evaluateExpression(stmt.argument, scope) : undefined;
            this.createState(`Return: ${this.valueToString(value)}`);
            throw new ReturnValue(value);
        }
    }

    /**
     * Evaluate an expression
     */
    evaluateExpression(expr, scope) {
        if (!expr) return undefined;

        if (expr.type === 'Literal') {
            return expr.value;
        }

        if (expr.type === 'Identifier') {
            return this.getVariable(expr.name, scope);
        }

        if (expr.type === 'ArrayExpression') {
            return expr.elements.map(elem => this.evaluateExpression(elem, scope));
        }

        if (expr.type === 'ObjectExpression') {
            const obj = {};
            for (const prop of expr.properties) {
                const key = prop.key.name;
                obj[key] = this.evaluateExpression(prop.value, scope);
            }
            return obj;
        }

        if (expr.type === 'BinaryExpression') {
            const left = this.evaluateExpression(expr.left, scope);
            const right = this.evaluateExpression(expr.right, scope);
            return this.evaluateBinaryOperation(expr.operator, left, right);
        }

        if (expr.type === 'UnaryExpression') {
            const argument = this.evaluateExpression(expr.argument, scope);
            return this.evaluateUnaryOperation(expr.operator, argument);
        }

        if (expr.type === 'AssignmentExpression') {
            const value = this.evaluateExpression(expr.right, scope);
            if (expr.left.type === 'Identifier') {
                this.setVariable(expr.left.name, value, scope);
            } else if (expr.left.type === 'MemberExpression') {
                const obj = this.evaluateExpression(expr.left.object, scope);
                const prop = expr.left.computed
                    ? this.evaluateExpression(expr.left.property, scope)
                    : expr.left.property.name;
                if (expr.operator === '=') {
                    obj[prop] = value;
                } else {
                    obj[prop] = this.evaluateBinaryOperation(expr.operator.slice(0, -1), obj[prop], value);
                }
            }
            return value;
        }

        if (expr.type === 'ConditionalExpression') {
            const test = this.evaluateExpression(expr.test, scope);
            return test ? this.evaluateExpression(expr.consequent, scope) : this.evaluateExpression(expr.alternate, scope);
        }

        if (expr.type === 'CallExpression') {
            return this.evaluateFunctionCall(expr, scope);
        }

        if (expr.type === 'MemberExpression') {
            const object = this.evaluateExpression(expr.object, scope);
            const property = expr.computed
                ? this.evaluateExpression(expr.property, scope)
                : expr.property.name;
            return object[property];
        }

        if (expr.type === 'ThisExpression') {
            return scope.get('this') || globalThis;
        }

        return undefined;
    }

    /**
     * Evaluate binary operation
     */
    evaluateBinaryOperation(op, left, right) {
        switch (op) {
            case '+': return left + right;
            case '-': return left - right;
            case '*': return left * right;
            case '/': return left / right;
            case '%': return left % right;
            case '==': return left == right;
            case '!=': return left != right;
            case '===': return left === right;
            case '!==': return left !== right;
            case '<': return left < right;
            case '>': return left > right;
            case '<=': return left <= right;
            case '>=': return left >= right;
            case '&&': return left && right;
            case '||': return left || right;
            default: return undefined;
        }
    }

    /**
     * Evaluate unary operation
     */
    evaluateUnaryOperation(op, argument) {
        switch (op) {
            case '!': return !argument;
            case '-': return -argument;
            case '+': return +argument;
            default: return undefined;
        }
    }

    /**
     * Evaluate function call
     */
    evaluateFunctionCall(expr, scope) {
        const callee = this.evaluateExpression(expr.callee, scope);
        const args = expr.arguments.map(arg => this.evaluateExpression(arg, scope));

        // Built-in console.log
        if (expr.callee.type === 'MemberExpression' &&
            expr.callee.object.type === 'Identifier' &&
            expr.callee.object.name === 'console' &&
            expr.callee.property.type === 'Identifier' &&
            expr.callee.property.name === 'log') {
            const output = args.map(arg => this.valueToString(arg)).join(' ');
            this.output.push(output);
            this.createState(`console.log: ${output}`);
            return undefined;
        }

        // User-defined function
        if (typeof callee === 'function' && callee.__isUserDefined) {
            return callee(...args);
        }

        return undefined;
    }

    /**
     * Create a user-defined function
     */
    createFunction(funcDecl) {
        const self = this;
        const func = function(...args) {
            const funcScope = new Map();
            
            // Set parameters
            for (let i = 0; i < funcDecl.params.length; i++) {
                funcScope.set(funcDecl.params[i], args[i]);
            }

            // Push to call stack
            self.callStack.push({
                name: funcDecl.name,
                location: `line ${funcDecl.line}`,
                scope: funcScope
            });

            self.createState(`Function call: ${funcDecl.name}`);

            try {
                if (funcDecl.body.type === 'BlockStatement') {
                    self.executeBlockStatement(funcDecl.body.body, funcScope);
                } else {
                    self.executeStatement(funcDecl.body, funcScope);
                }
            } catch (e) {
                if (e instanceof ReturnValue) {
                    return e.value;
                }
                throw e;
            } finally {
                self.callStack.pop();
                self.createState(`Function return: ${funcDecl.name}`);
            }

            return undefined;
        };

        func.__isUserDefined = true;
        return func;
    }

    /**
     * Get variable from scope
     */
    getVariable(name, scope) {
        if (scope.has(name)) {
            return scope.get(name);
        }
        if (this.globalScope.has(name)) {
            return this.globalScope.get(name);
        }
        // Built-in values
        if (name === 'console') {
            return {
                log: (...args) => {
                    const output = args.map(arg => this.valueToString(arg)).join(' ');
                    this.output.push(output);
                    return undefined;
                }
            };
        }
        return undefined;
    }

    /**
     * Set variable in scope
     */
    setVariable(name, value, scope) {
        if (scope.has(name)) {
            scope.set(name, value);
        } else if (this.globalScope.has(name)) {
            this.globalScope.set(name, value);
        } else {
            // Auto-create in current scope
            scope.set(name, value);
        }
    }
}

/**
 * Exception classes for control flow
 */
class ReturnValue extends Error {
    constructor(value) {
        super();
        this.value = value;
    }
}

class BreakException extends Error {
    constructor() {
        super('Break');
    }
}

class ContinueException extends Error {
    constructor() {
        super('Continue');
    }
}
