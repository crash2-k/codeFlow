/**
 * SimpleParser - Parse JavaScript into an AST for execution visualization
 * This is a simplified parser that handles common JavaScript patterns
 */
export class SimpleParser {
    constructor(code) {
        this.code = code;
        this.tokens = [];
        this.currentTokenIndex = 0;
        this.ast = null;
        this.statements = [];
        this.functionDeclarations = new Map();
    }

    /**
     * Main parse method
     */
    parse() {
        try {
            this.tokenize();
            this.buildAST();
            return {
                ast: this.ast,
                statements: this.statements,
                functions: this.functionDeclarations,
                error: null
            };
        } catch (error) {
            return {
                ast: null,
                statements: [],
                functions: new Map(),
                error: {
                    message: error.message,
                    line: this.getLineNumber(error),
                    column: this.getColumnNumber(error)
                }
            };
        }
    }

    /**
     * Simple tokenizer
     */
    tokenize() {
        const patterns = [
            { type: 'NUMBER', regex: /^\d+\.?\d*/ },
            { type: 'STRING', regex: /^(["'`])(?:(?=(\\?))\2.)*?\1/ },
            { type: 'BOOLEAN', regex: /^(true|false)\b/ },
            { type: 'NULL', regex: /^null\b/ },
            { type: 'UNDEFINED', regex: /^undefined\b/ },
            { type: 'FUNCTION', regex: /^function\b/ },
            { type: 'RETURN', regex: /^return\b/ },
            { type: 'IF', regex: /^if\b/ },
            { type: 'ELSE', regex: /^else\b/ },
            { type: 'FOR', regex: /^for\b/ },
            { type: 'WHILE', regex: /^while\b/ },
            { type: 'DO', regex: /^do\b/ },
            { type: 'BREAK', regex: /^break\b/ },
            { type: 'CONTINUE', regex: /^continue\b/ },
            { type: 'CONST', regex: /^const\b/ },
            { type: 'LET', regex: /^let\b/ },
            { type: 'VAR', regex: /^var\b/ },
            { type: 'ASYNC', regex: /^async\b/ },
            { type: 'AWAIT', regex: /^await\b/ },
            { type: 'NEW', regex: /^new\b/ },
            { type: 'THIS', regex: /^this\b/ },
            { type: 'ARROW', regex: /^=>/ },
            { type: 'OPERATOR', regex: /^(===|!==|==|!=|<=|>=|&&|\|\||[+\-*/%=<>!&|^])/ },
            { type: 'LPAREN', regex: /^\(/ },
            { type: 'RPAREN', regex: /^\)/ },
            { type: 'LBRACE', regex: /^\{/ },
            { type: 'RBRACE', regex: /^\}/ },
            { type: 'LBRACKET', regex: /^\[/ },
            { type: 'RBRACKET', regex: /^\]/ },
            { type: 'SEMICOLON', regex: /^;/ },
            { type: 'COMMA', regex: /^,/ },
            { type: 'DOT', regex: /^\./ },
            { type: 'COLON', regex: /^:/ },
            { type: 'QUESTION', regex: /^\?/ },
            { type: 'IDENTIFIER', regex: /^[a-zA-Z_$][a-zA-Z0-9_$]*/ },
            { type: 'WHITESPACE', regex: /^\s+/ }
        ];

        let position = 0;
        while (position < this.code.length) {
            let matched = false;

            for (const pattern of patterns) {
                const match = this.code.slice(position).match(pattern.regex);
                if (match) {
                    const token = match[0];
                    if (pattern.type !== 'WHITESPACE') {
                        this.tokens.push({
                            type: pattern.type,
                            value: token,
                            position: position,
                            line: this.getLineNumber({ position })
                        });
                    }
                    position += token.length;
                    matched = true;
                    break;
                }
            }

            if (!matched) {
                throw new Error(`Unknown token at position ${position}: ${this.code[position]}`);
            }
        }
    }

    /**
     * Build AST from tokens
     */
    buildAST() {
        this.currentTokenIndex = 0;
        const body = [];

        while (!this.isAtEnd()) {
            const stmt = this.parseStatement();
            if (stmt) {
                body.push(stmt);
                this.statements.push(stmt);
            }
        }

        this.ast = {
            type: 'Program',
            body: body
        };
    }

    /**
     * Parse a statement
     */
    parseStatement() {
        const token = this.peek();
        if (!token) return null;

        if (this.match('FUNCTION')) {
            return this.parseFunctionDeclaration();
        }
        if (this.match('CONST', 'LET', 'VAR')) {
            return this.parseVariableDeclaration();
        }
        if (this.match('IF')) {
            return this.parseIfStatement();
        }
        if (this.match('FOR')) {
            return this.parseForStatement();
        }
        if (this.match('WHILE')) {
            return this.parseWhileStatement();
        }
        if (this.match('RETURN')) {
            return this.parseReturnStatement();
        }
        if (this.match('BREAK')) {
            this.advance();
            this.consume('SEMICOLON');
            return { type: 'BreakStatement', line: token.line };
        }
        if (this.match('CONTINUE')) {
            this.advance();
            this.consume('SEMICOLON');
            return { type: 'ContinueStatement', line: token.line };
        }
        if (this.match('LBRACE')) {
            return this.parseBlockStatement();
        }

        // Expression statement
        const expr = this.parseExpression();
        this.consume('SEMICOLON', true); // Optional semicolon
        return {
            type: 'ExpressionStatement',
            expression: expr,
            line: token.line
        };
    }

    /**
     * Parse function declaration
     */
    parseFunctionDeclaration() {
        const startToken = this.previous();
        const name = this.consumeIdentifier();
        
        this.consume('LPAREN');
        const params = this.parseParameters();
        this.consume('RPAREN');
        
        this.consume('LBRACE');
        const body = this.parseBlockStatement();
        this.consume('RBRACE');

        const func = {
            type: 'FunctionDeclaration',
            name: name,
            params: params,
            body: body,
            line: startToken.line
        };

        this.functionDeclarations.set(name, func);
        return func;
    }

    /**
     * Parse parameters
     */
    parseParameters() {
        const params = [];
        if (!this.check('RPAREN')) {
            do {
                params.push(this.consumeIdentifier());
            } while (this.match('COMMA'));
        }
        return params;
    }

    /**
     * Parse variable declaration
     */
    parseVariableDeclaration() {
        const startToken = this.previous();
        const kind = startToken.value; // 'const', 'let', or 'var'
        
        const declarations = [];
        do {
            const name = this.consumeIdentifier();
            let init = null;

            if (this.match('OPERATOR')) {
                if (this.previous().value === '=') {
                    init = this.parseExpression();
                }
            }

            declarations.push({ name, init });
        } while (this.match('COMMA'));

        this.consume('SEMICOLON', true);

        return {
            type: 'VariableDeclaration',
            kind: kind,
            declarations: declarations,
            line: startToken.line
        };
    }

    /**
     * Parse if statement
     */
    parseIfStatement() {
        const startToken = this.previous();
        this.consume('LPAREN');
        const test = this.parseExpression();
        this.consume('RPAREN');

        const consequent = this.parseStatement();
        let alternate = null;

        if (this.match('ELSE')) {
            alternate = this.parseStatement();
        }

        return {
            type: 'IfStatement',
            test: test,
            consequent: consequent,
            alternate: alternate,
            line: startToken.line
        };
    }

    /**
     * Parse for statement
     */
    parseForStatement() {
        const startToken = this.previous();
        this.consume('LPAREN');

        let init = null;
        if (!this.check('SEMICOLON')) {
            if (this.match('CONST', 'LET', 'VAR')) {
                init = this.parseVariableDeclaration();
                // Remove the semicolon consumption from parseVariableDeclaration
                this.currentTokenIndex--;
            } else {
                init = this.parseExpression();
            }
        }
        this.consume('SEMICOLON');

        let test = null;
        if (!this.check('SEMICOLON')) {
            test = this.parseExpression();
        }
        this.consume('SEMICOLON');

        let update = null;
        if (!this.check('RPAREN')) {
            update = this.parseExpression();
        }
        this.consume('RPAREN');

        const body = this.parseStatement();

        return {
            type: 'ForStatement',
            init: init,
            test: test,
            update: update,
            body: body,
            line: startToken.line
        };
    }

    /**
     * Parse while statement
     */
    parseWhileStatement() {
        const startToken = this.previous();
        this.consume('LPAREN');
        const test = this.parseExpression();
        this.consume('RPAREN');

        const body = this.parseStatement();

        return {
            type: 'WhileStatement',
            test: test,
            body: body,
            line: startToken.line
        };
    }

    /**
     * Parse return statement
     */
    parseReturnStatement() {
        const startToken = this.previous();
        let argument = null;

        if (!this.check('SEMICOLON') && !this.isAtEnd()) {
            argument = this.parseExpression();
        }

        this.consume('SEMICOLON', true);

        return {
            type: 'ReturnStatement',
            argument: argument,
            line: startToken.line
        };
    }

    /**
     * Parse block statement
     */
    parseBlockStatement() {
        const statements = [];

        while (!this.check('RBRACE') && !this.isAtEnd()) {
            const stmt = this.parseStatement();
            if (stmt) {
                statements.push(stmt);
            }
        }

        return {
            type: 'BlockStatement',
            body: statements
        };
    }

    /**
     * Parse expression
     */
    parseExpression() {
        return this.parseAssignmentExpression();
    }

    /**
     * Parse assignment expression
     */
    parseAssignmentExpression() {
        let expr = this.parseConditionalExpression();

        if (this.match('OPERATOR')) {
            const op = this.previous().value;
            if (['=', '+=', '-=', '*=', '/=', '%='].includes(op)) {
                const right = this.parseAssignmentExpression();
                expr = {
                    type: 'AssignmentExpression',
                    operator: op,
                    left: expr,
                    right: right
                };
            } else {
                this.currentTokenIndex--;
            }
        }

        return expr;
    }

    /**
     * Parse conditional expression (ternary)
     */
    parseConditionalExpression() {
        let expr = this.parseLogicalOrExpression();

        if (this.match('QUESTION')) {
            const consequent = this.parseExpression();
            this.consume('COLON');
            const alternate = this.parseExpression();
            expr = {
                type: 'ConditionalExpression',
                test: expr,
                consequent: consequent,
                alternate: alternate
            };
        }

        return expr;
    }

    /**
     * Parse logical OR expression
     */
    parseLogicalOrExpression() {
        let expr = this.parseLogicalAndExpression();

        while (this.match('OPERATOR')) {
            const op = this.previous().value;
            if (op === '||') {
                const right = this.parseLogicalAndExpression();
                expr = {
                    type: 'BinaryExpression',
                    operator: op,
                    left: expr,
                    right: right
                };
            } else {
                this.currentTokenIndex--;
                break;
            }
        }

        return expr;
    }

    /**
     * Parse logical AND expression
     */
    parseLogicalAndExpression() {
        let expr = this.parseEqualityExpression();

        while (this.match('OPERATOR')) {
            const op = this.previous().value;
            if (op === '&&') {
                const right = this.parseEqualityExpression();
                expr = {
                    type: 'BinaryExpression',
                    operator: op,
                    left: expr,
                    right: right
                };
            } else {
                this.currentTokenIndex--;
                break;
            }
        }

        return expr;
    }

    /**
     * Parse equality expression
     */
    parseEqualityExpression() {
        let expr = this.parseRelationalExpression();

        while (this.match('OPERATOR')) {
            const op = this.previous().value;
            if (['===', '!==', '==', '!='].includes(op)) {
                const right = this.parseRelationalExpression();
                expr = {
                    type: 'BinaryExpression',
                    operator: op,
                    left: expr,
                    right: right
                };
            } else {
                this.currentTokenIndex--;
                break;
            }
        }

        return expr;
    }

    /**
     * Parse relational expression
     */
    parseRelationalExpression() {
        let expr = this.parseAdditiveExpression();

        while (this.match('OPERATOR')) {
            const op = this.previous().value;
            if (['<', '>', '<=', '>='].includes(op)) {
                const right = this.parseAdditiveExpression();
                expr = {
                    type: 'BinaryExpression',
                    operator: op,
                    left: expr,
                    right: right
                };
            } else {
                this.currentTokenIndex--;
                break;
            }
        }

        return expr;
    }

    /**
     * Parse additive expression
     */
    parseAdditiveExpression() {
        let expr = this.parseMultiplicativeExpression();

        while (this.match('OPERATOR')) {
            const op = this.previous().value;
            if (['+', '-'].includes(op)) {
                const right = this.parseMultiplicativeExpression();
                expr = {
                    type: 'BinaryExpression',
                    operator: op,
                    left: expr,
                    right: right
                };
            } else {
                this.currentTokenIndex--;
                break;
            }
        }

        return expr;
    }

    /**
     * Parse multiplicative expression
     */
    parseMultiplicativeExpression() {
        let expr = this.parseUnaryExpression();

        while (this.match('OPERATOR')) {
            const op = this.previous().value;
            if (['*', '/', '%'].includes(op)) {
                const right = this.parseUnaryExpression();
                expr = {
                    type: 'BinaryExpression',
                    operator: op,
                    left: expr,
                    right: right
                };
            } else {
                this.currentTokenIndex--;
                break;
            }
        }

        return expr;
    }

    /**
     * Parse unary expression
     */
    parseUnaryExpression() {
        if (this.match('OPERATOR')) {
            const op = this.previous().value;
            if (['!', '-', '+'].includes(op)) {
                const argument = this.parseUnaryExpression();
                return {
                    type: 'UnaryExpression',
                    operator: op,
                    argument: argument
                };
            } else {
                this.currentTokenIndex--;
            }
        }

        return this.parsePostfixExpression();
    }

    /**
     * Parse postfix expression (function calls, member access, array access)
     */
    parsePostfixExpression() {
        let expr = this.parsePrimaryExpression();

        while (true) {
            if (this.match('LPAREN')) {
                const args = this.parseArguments();
                this.consume('RPAREN');
                expr = {
                    type: 'CallExpression',
                    callee: expr,
                    arguments: args
                };
            } else if (this.match('LBRACKET')) {
                const index = this.parseExpression();
                this.consume('RBRACKET');
                expr = {
                    type: 'MemberExpression',
                    object: expr,
                    property: index,
                    computed: true
                };
            } else if (this.match('DOT')) {
                const property = this.consumeIdentifier();
                expr = {
                    type: 'MemberExpression',
                    object: expr,
                    property: { type: 'Identifier', name: property },
                    computed: false
                };
            } else {
                break;
            }
        }

        return expr;
    }

    /**
     * Parse primary expression
     */
    parsePrimaryExpression() {
        if (this.match('NUMBER')) {
            return {
                type: 'Literal',
                value: parseFloat(this.previous().value)
            };
        }

        if (this.match('STRING')) {
            const value = this.previous().value;
            // Remove quotes
            return {
                type: 'Literal',
                value: value.slice(1, -1)
            };
        }

        if (this.match('BOOLEAN')) {
            return {
                type: 'Literal',
                value: this.previous().value === 'true'
            };
        }

        if (this.match('NULL')) {
            return {
                type: 'Literal',
                value: null
            };
        }

        if (this.match('UNDEFINED')) {
            return {
                type: 'Identifier',
                name: 'undefined'
            };
        }

        if (this.match('THIS')) {
            return {
                type: 'ThisExpression'
            };
        }

        if (this.match('IDENTIFIER')) {
            return {
                type: 'Identifier',
                name: this.previous().value
            };
        }

        if (this.match('LPAREN')) {
            const expr = this.parseExpression();
            this.consume('RPAREN');
            return expr;
        }

        if (this.match('LBRACKET')) {
            return this.parseArrayLiteral();
        }

        if (this.match('LBRACE')) {
            return this.parseObjectLiteral();
        }

        throw new Error(`Unexpected token: ${this.peek()?.value}`);
    }

    /**
     * Parse array literal
     */
    parseArrayLiteral() {
        const elements = [];

        while (!this.check('RBRACKET') && !this.isAtEnd()) {
            if (this.check('COMMA')) {
                elements.push(null);
                this.advance();
            } else {
                elements.push(this.parseExpression());
                if (!this.check('RBRACKET')) {
                    this.consume('COMMA');
                }
            }
        }

        this.consume('RBRACKET');
        return {
            type: 'ArrayExpression',
            elements: elements
        };
    }

    /**
     * Parse object literal
     */
    parseObjectLiteral() {
        const properties = [];

        while (!this.check('RBRACE') && !this.isAtEnd()) {
            const key = this.consumeIdentifier();
            this.consume('COLON');
            const value = this.parseExpression();

            properties.push({
                type: 'Property',
                key: { type: 'Identifier', name: key },
                value: value
            });

            if (!this.check('RBRACE')) {
                this.consume('COMMA');
            }
        }

        this.consume('RBRACE');
        return {
            type: 'ObjectExpression',
            properties: properties
        };
    }

    /**
     * Parse arguments
     */
    parseArguments() {
        const args = [];
        if (!this.check('RPAREN')) {
            do {
                args.push(this.parseExpression());
            } while (this.match('COMMA'));
        }
        return args;
    }

    /**
     * Helper methods
     */
    peek() {
        return this.tokens[this.currentTokenIndex];
    }

    previous() {
        return this.tokens[this.currentTokenIndex - 1];
    }

    advance() {
        if (!this.isAtEnd()) {
            this.currentTokenIndex++;
        }
        return this.previous();
    }

    check(type) {
        if (this.isAtEnd()) return false;
        return this.peek().type === type;
    }

    match(...types) {
        for (const type of types) {
            if (this.check(type)) {
                this.advance();
                return true;
            }
        }
        return false;
    }

    consume(type, optional = false) {
        if (this.check(type)) {
            return this.advance();
        }
        if (!optional) {
            throw new Error(`Expected ${type} but got ${this.peek()?.type}`);
        }
        return null;
    }

    consumeIdentifier() {
        if (this.check('IDENTIFIER')) {
            return this.advance().value;
        }
        throw new Error(`Expected identifier`);
    }

    isAtEnd() {
        return this.currentTokenIndex >= this.tokens.length;
    }

    getLineNumber(error) {
        if (error.position !== undefined) {
            return this.code.slice(0, error.position).split('\n').length;
        }
        return 0;
    }

    getColumnNumber(error) {
        if (error.position !== undefined) {
            const lines = this.code.slice(0, error.position).split('\n');
            return lines[lines.length - 1].length;
        }
        return 0;
    }
}
