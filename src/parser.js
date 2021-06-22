const Lexer = require('./lexer');
const TOKENS = require('./lexer/tokens');
const Stack = require('./utils/stack');
const AST = require('./parser/ast');
const util = require('util');
const varNamespaces = require('./build/var-namespaces');
const literals = require('./build/literals');
const envs = require('./build/envs');
const validator = require('./parser/validator');
const logger = require('node-color-log');
const statements = require('./parser/statements');
const getPrecedence = require('./parser/precedence');

const Parser = function(content, collectAll) {
	const me = this;

	me.content = content;
	me.lexer = new Lexer(content);
	me.history = [];
	me.prefetchedTokens = [];
	me.token = null;
	me.previousToken = null;
	me.imports = [];
	me.includes = [];
	me.namespaces = {};
	me.collectAll = collectAll;

	return me;
};

Parser.prototype.next = function() {
	const me = this;

	if (me.previousToken) {
		me.history.push(me.previousToken);
	}

	me.previousToken = me.token;
	me.token = me.fetch();

	return me;
};

Parser.prototype.isBlockFollow = function(token) {
	const type = token.type;
	const value = token.value;
    if (TOKENS.EOF === type) return true;
    if (TOKENS.Keyword !== type) return false;
    return value.indexOf('else') === 0 || value.indexOf('end') === 0 || TOKENS.EOL === type;
};

Parser.prototype.consume = function(value) {
	const me = this;
	if (value === me.token.value) {
		me.next();
		return true;
    }
    return false;
};

Parser.prototype.fetch = function() {
	const me = this;
	return me.prefetch(1) && me.prefetchedTokens.shift();
};

Parser.prototype.prefetch = function(offset) {
	const me = this;
	const offsetIndex = offset - 1;

	while (me.prefetchedTokens.length < offset) {
		const next = me.lexer.next();
		if (!next) break;
		me.prefetchedTokens.push(next);
		if (next.type === TOKENS.EOF) break;
	}

	return me.prefetchedTokens[offsetIndex];
};

Parser.prototype.consumeMany = function(values) {
	const me = this;
	if (values.indexOf(me.token.value) != -1) {
		me.next();
		return true;
    }
    return false;
};

Parser.prototype.expect = function(value) {
	const me = this;
	if (value === me.token.value) return me.next();
	me.exception('Unexpected value ' + me.token.value + '. Expected: ' + value)
};

Parser.prototype.expectMany = function(values) {
	const me = this;
	if (values.indexOf(me.token.value) != -1) return me.next();
	me.exception('Unexpected value ' + me.token.value + '. Expected: ' + values)
};

Parser.prototype.isUnary = function(token) {
	const me = this;
	const type = token.type;
	const value = token.value;
	if (TOKENS.Punctuator === type) return '@' === value;
	if (TOKENS.Keyword === type) return 'new' === value;
	return false;
};

Parser.prototype.parseIdentifier = function() {
	const me = this;
	const mainStatementLine = me.token.line;
	const identifier = me.token.value;
	if (TOKENS.Identifier === me.token.type) {
		if (me.collectAll && !me.namespaces.hasOwnProperty(identifier) && !validator.isNative(identifier)) {
			me.namespaces[identifier] = true;
			varNamespaces.createNamespace(identifier);
		}
		me.next();
		return AST.identifier(identifier, mainStatementLine);
	}
	me.exception('Unexpected identifier');
};

Parser.prototype.parseMapConstructor = function(flowContext) {
	const me = this;
	const mainStatementLine = me.token.line;
	const fields = []
	let key;
	let value;

	while (true) {
		if (TOKENS.StringLiteral === me.token.type && ':' === me.prefetch(1).value) {
	        const mapKeyStringLine = me.token.line;
	        key = me.parsePrimaryExpression();
			me.next();
			value = me.parseExpectedExpression(flowContext);
			fields.push(AST.mapKeyString(key, value, mapKeyStringLine));
	  	}
		if (',;'.indexOf(me.token.value) >= 0) {
			me.next();
			continue;
		}
	  	break;
	}

	me.expect('}');

	return AST.mapConstructorExpression(fields, mainStatementLine);
};

Parser.prototype.parseListConstructor = function(flowContext) {
	const me = this;
	const mainStatementLine = me.token.line;
	const fields = []
	let key;
	let value;

	while (true) {
		const listValueLine = me.token.line;
		value = me.parseExpression(flowContext)
		if (value != null) fields.push(AST.listValue(value, listValueLine));
		if (',;'.indexOf(me.token.value) >= 0) {
			me.next();
			continue;
		}
	  	break;
	}
	me.expect(']');
	return AST.listConstructorExpression(fields, mainStatementLine);
};

Parser.prototype.parseRighthandExpressionGreedy = function(base, flowContext) {
	const me = this;

	while (true) {
		const newBase = me.parseRighthandExpressionPart(base, flowContext);
		if (newBase === null) break;
		base = newBase;
	}

	return base;
};

Parser.prototype.parseRighthandExpression = function(flowContext) {
	const me = this;
    let base;
    let name;

    if (TOKENS.Identifier === me.token.type) {
      name = me.token.value;
      base = me.parseIdentifier();
    } else if (me.consume('(')) {
      base = me.parseExpectedExpression(flowContext, true);
      me.expect(')');
    } else {
      return null;
    }

	return me.parseRighthandExpressionGreedy(base, flowContext);
};

Parser.prototype.parseMathShorthandLeftOperator = function(flowContext) {
	const me = this;
	const mainStatementLine = me.token.line;
	const operatorToken = me.token;
	const operator = operatorToken.value.charAt(0);
	me.next();
	const scopeBody = flowContext.get();
	const base = me.parseExpectedExpression(flowContext);
	const number = AST.literal('NumericLiteral', 1, 1, mainStatementLine);
	logger.warn('Lefthand "' +  operatorToken.value + '" not fully supported. Will only put the math operation in front. (Line: ' + me.token.line + ')');
	return AST.binaryExpression(operator, number, base, mainStatementLine);
};

Parser.prototype.parseMathShorthandRightOperator = function(base) {
	const me = this;
	const mainStatementLine = me.token.line;
	const operator = me.previousToken.value.charAt(0);
	const number = AST.literal('NumericLiteral', 1, 1, mainStatementLine);
	return AST.binaryExpression(operator, base, number, mainStatementLine);
};

Parser.prototype.parseAssignmentShorthandOperator = function(base, flowContext) {
	const me = this;
	const mainStatementLine = me.token.line;
	const operator = me.previousToken.value.charAt(0);
	const value = me.parseSubExpression(flowContext);
	const expression = AST.binaryExpression(operator, base, value, mainStatementLine);
	return AST.assignmentStatement(base, expression, mainStatementLine);
};

Parser.prototype.parseIndexExpression = function(base, flowContext) {
	const me = this;
	const mainStatementLine = me.token.line;
	let offset = 1;
	let token = me.token;

	while (true) {
		if (token.value === ']') break;
		if (token.value === ':') {
			let left;
			let right;

			if (!me.consume(':')) {
				left = me.parseExpectedExpression(flowContext);
				me.expect(':');
			} else {
				left = AST.emptyExpression(mainStatementLine);
			}

			if (!me.consume(']')) {
				right = me.parseExpectedExpression(flowContext);
				me.expect(']');
			} else {
				right = AST.emptyExpression(mainStatementLine);
			}

			const sliceExpression = AST.sliceExpression(left, right, mainStatementLine);

			return  AST.indexExpression(base, sliceExpression, mainStatementLine);
		}

		token = me.prefetch(offset);
		offset = offset + 1;
	}

	expression = me.parseExpectedExpression(flowContext);
	me.expect(']');

	return AST.indexExpression(base, expression, mainStatementLine);
};

Parser.prototype.parseRighthandExpressionPart = function(base, flowContext) {
	const me = this;
	const mainStatementLine = me.token.line;
    let expression;
    let identifier;
    const type = me.token.type;

    if (TOKENS.Punctuator === type) {
    	const value = me.token.value;

    	if ('++' === value || '--' === value) {
			me.next();
			return  me.parseMathShorthandRightOperator(base);
		} else if ('+=' === value || '-=' === value || '*=' === value || '/=' === value) {
			me.next();
			return  me.parseAssignmentShorthandOperator(base, flowContext);
		} else if ('[' === value) {
			me.next();
			return me.parseIndexExpression(base, expression);
    	} else if ('.' === value) {
			me.next();
			identifier = me.parseIdentifier();
			return AST.memberExpression(base, '.', identifier, mainStatementLine);
		} else if ('(' === value) {
			return me.parseCallExpression(base, flowContext);
		}
	}

	return null;
};

Parser.prototype.parseCallExpression = function(base, flowContext) {
	const me = this;
	const mainStatementLine = me.token.line;

	if (TOKENS.Punctuator === me.token.type) {
		const value = me.token.value;

		if ('(' === value) {
			if (me.token.line !== me.previousToken.line) {
				me.exception('Unexpected line');
			}

			me.next();
			const expressions = [];
			let expression = me.parseExpression(flowContext);

			if (null != expression) expressions.push(expression);

			while (me.consume(',')) {
				expression = me.parseExpectedExpression(flowContext);
				expressions.push(expression);
			}

			me.expect(')');
			return AST.callExpression(base, expressions, mainStatementLine);
		}
	}

	me.exception('Unexpected arguments');
};

Parser.prototype.parseFloatExpression = function(baseValue) {
	if (baseValue === 0) baseValue = '';
	const me = this;
	const mainStatementLine = me.token.line;
	me.next();
	const floatValue = [baseValue, me.token.value].join('.');
	me.next();
	const base = AST.literal(TOKENS.NumericLiteral, floatValue, floatValue, mainStatementLine);
	if (me.collectAll) literals.add(base);
	return base;
};

Parser.prototype.parsePrimaryExpression = function(flowContext) {
	const me = this;
	const mainStatementLine = me.token.line;
	const value = me.token.value;
	const type = me.token.type;

	if (validator.isLiteral(type)) {
		const raw = me.content.slice(me.token.range[0], me.token.range[1]);
		let base = AST.literal(type, value, raw, mainStatementLine);

		if (me.collectAll) literals.add(base);

		if (TOKENS.NilLiteral !== type && me.prefetch(1).value === '.') {
			me.next();
			if (TOKENS.NumericLiteral === type && TOKENS.NumericLiteral === me.prefetch(1).type) {
				base = me.parseFloatExpression(value);
			} else {
				base = me.parseRighthandExpressionGreedy(base, flowContext);
			}
		} else {
			me.next();
		}

		return base;
	} else if ('.' === value && TOKENS.NumericLiteral === me.prefetch(1).type) {
		return me.parseFloatExpression(0);
	} else if (TOKENS.Keyword === type && '#envar' === value) {
		me.next();
		return me.parseFeatureEnvarStatement(flowContext);
	} else if (TOKENS.Keyword === type && 'function' === value) {
		me.next();
		return me.parseFunctionDeclaration(flowContext);
	} else if (me.consumeMany(['{', '['])) {
		let base;
		if ('{' === value) {
			base = me.parseMapConstructor(flowContext);
		} else {
			base = me.parseListConstructor(flowContext);
		}

		base = me.parseRighthandExpressionGreedy(base, flowContext);

		return base;
	}
};

Parser.prototype.parseSubExpression = function (flowContext, minPrecedence) {
	if (minPrecedence == null) minPrecedence = 0;
	const me = this;
	const mainStatementLine = me.token.line;
    let operator = me.token.value;
    let expression = null;

    if (me.isUnary(me.token)) {
		me.next();
		const argument = me.parseSubExpression(flowContext);
		expression = AST.unaryExpression(operator, argument, mainStatementLine);
    } else if (TOKENS.Punctuator === me.token.type && (operator === '++' || operator === '--')) {
		expression = me.parseMathShorthandLeftOperator(flowContext, '(' === me.previousToken.value);
	} else if (TOKENS.Keyword === me.token.type && me.token.value === 'not') {
		me.next();
		const argument = me.parseSubExpression(flowContext, 10);
		expression = AST.negationExpression(argument, mainStatementLine);
	}
    if (null == expression) {
      expression = me.parsePrimaryExpression(flowContext);

      if (null == expression) {
        expression = me.parseRighthandExpression(flowContext);
      }
    }

    let precedence;
	while (true) {
		operator = me.token.value;

		if (validator.isExpressionOperator(operator)) {
			precedence = getPrecedence(operator);
		} else {
			precedence = 0;
		}

		if (precedence === 0 || precedence <= minPrecedence) break;
		if ('^' === operator) --precedence;
		me.next();
		let right = me.parseSubExpression(flowContext, precedence);
		if (null == right) {
			right = AST.emptyExpression(mainStatementLine);
		}

		expression = AST.binaryExpression(operator, expression, right, mainStatementLine);
	}

    return expression;
};

Parser.prototype.parseFeaturePath = function() {
	const me = this;
	let path = '';

	while (true) {
		path = path + me.token.value;
		me.next();
		if (';' === me.token.value) break;
	}

	return path;
};

Parser.prototype.parseFeatureIncludeStatement = function() {
	const me = this;
	const mainStatementLine = me.token.line;
	const path = me.parseFeaturePath();
	me.expect(';');
	const base = AST.featureIncludeExpression(path, mainStatementLine);
	me.includes.push(base);
	return base;
};

Parser.prototype.parseFeatureImportStatement = function() {
	const me = this;
	const mainStatementLine = me.token.line;
	const name = me.parseIdentifier();
	me.expect('from');
	const path = me.parseFeaturePath();
	me.expect(';');
	const base = AST.featureImportExpression(name, path, mainStatementLine);
	me.imports.push(base);
	return base;
};

Parser.prototype.parseFeatureEnvarNameStatement = function() {
	const me = this;
	const mainStatementLine = me.token.line;
	const name = me.token.value;
	const value = envs.get(name);
	let raw;
	let type = TOKENS.StringLiteral;

	if (value == null) {
		type = TOKENS.NilLiteral;
		raw = 'null';
	} else {
		raw = '"' + value + '"';
	}

	const literal = AST.literal(type, value, raw, mainStatementLine);

	if (me.collectAll) literals.add(literal);
	me.next();
	return literal;
};

Parser.prototype.parseFeatureEnvarStatement = function(flowContext) {
	const me = this;
	const mainStatementLine = me.token.line;
	const name = me.parseFeatureEnvarNameStatement();
	me.expect(';');
	let base = AST.featureEnvarExpression(name, mainStatementLine);
	if ('.' === me.token.value) {
		while (true) {
			const newBase = me.parseRighthandExpressionPart(base, flowContext);
			if (newBase === null) break;
			base = newBase;
		}
	}
	return base;
};

Parser.prototype.parseWhileStatement = function(flowContext) {
	const me = this;
	const mainStatementLine = me.token.line;
	const condition = me.parseExpectedExpression(flowContext);

	let body;
	if (TOKENS.EOL === me.token.type) {
		body = me.parseBlock(flowContext);
		me.expect('end while');
	} else {
		body = me.parseBlockShortcut(flowContext);
		me.expectMany(['end while', ';', '<eof>']);
	}

	return AST.whileStatement(condition, body, mainStatementLine);
};

Parser.prototype.parseExpression = function(flowContext) {
	const me = this;
	const expression = me.parseSubExpression(flowContext);
	return expression;
};

Parser.prototype.parseExpectedExpression = function(flowContext) {
	const me = this;
	const expression = me.parseExpression(flowContext);
	if (expression != null) return expression;
	me.exception('Unexpected expression');
};

Parser.prototype.parseIfShortcutStatement = function(flowContext, condition) {
	const me = this;
	const clauses = [];
	const mainStatementLine = me.token.line;
	let statementLine = mainStatementLine;
	let body = [];

	body = me.parseBlockShortcut(flowContext);

	const isActuallyShortcut = body.length === 1;

	if (isActuallyShortcut) {
		clauses.push(AST.ifShortcutClause(condition, body[0], statementLine));
	} else {
		clauses.push(AST.ifClause(condition, body, statementLine));
	}

    while (me.consume('else if')) {
    	statementLine = me.token.line;
		condition = me.parseExpectedExpression(flowContext);
		me.expect('then');
		body = me.parseBlockShortcut(flowContext);

		if (isActuallyShortcut) {
			clauses.push(AST.elseifShortcutClause(condition, body[0], statementLine));
		} else {
			clauses.push(AST.elseifClause(condition, body, statementLine));
		}
	}

	if (me.consume('else')) {
		statementLine = me.token.line;
		body = me.parseBlockShortcut(flowContext);

		if (isActuallyShortcut) {
			clauses.push(AST.elseShortcutClause(body[0], statementLine));
		} else {
			clauses.push(AST.elseClause(body, statementLine));
		}
	}

	me.consumeMany(['end if', ';', '<eof>']);

	if (isActuallyShortcut) {
		return AST.ifShortcutStatement(clauses, mainStatementLine);
	}

	return AST.ifStatement(clauses, mainStatementLine);
}

Parser.prototype.parseIfStatement = function(flowContext) {
	const me = this;
	const clauses = [];
	const mainStatementLine = me.token.line;
	let statementLine = mainStatementLine;
	let condition;
	let body;

	condition = me.parseExpectedExpression(flowContext);
	me.expect('then');

	if (TOKENS.EOL !== me.token.type) return me.parseIfShortcutStatement(flowContext, condition);

	body = me.parseBlock(flowContext);
	clauses.push(AST.ifClause(condition, body, statementLine));

	while (me.consume('else if')) {
		statementLine = mainStatementLine;
		condition = me.parseExpectedExpression(flowContext);
		me.expect('then');
		body = me.parseBlock(flowContext);
		clauses.push(AST.elseifClause(condition, body, statementLine));
	}

	if (me.consume('else')) {
		statementLine = mainStatementLine;
		body = me.parseBlock(flowContext);
		clauses.push(AST.elseClause(body, statementLine));
	}

	me.expect('end if');

	return AST.ifStatement(clauses, mainStatementLine);
};

Parser.prototype.parseReturnStatement = function(flowContext, isShortcutStatement) {
	const me = this;
	const mainStatementLine = me.token.line;
	const expressions = [];

	if ('end' !== me.token.value) {
		let expression = me.parseExpression(flowContext);
		if (null != expression) expressions.push(expression);
		while (me.consume(',')) {
			expression = me.parseExpectedExpression(flowContext);
			expressions.push(expression);
		}
		if (!isShortcutStatement) me.consume(';');
	}

	return AST.returnStatement(expressions, mainStatementLine);
};

Parser.prototype.parseFunctionName = function() {
	const me = this;
	const mainStatementLine = me.token.line;
    let base;
    let name;
    let marker;

    base = me.parseIdentifier();

    while (me.consume('.')) {
		name = me.parseIdentifier();
		base = AST.memberExpression(base, '.', name, mainStatementLine);
    }

	return base;
};

Parser.prototype.parseAssignmentOrCallStatement = function(flowContext) {
    const me = this;
    const mainStatementLine = me.token.line;
    let base;
    let last = me.token;

	if (TOKENS.Identifier === last.type) {
		base = me.parseIdentifier();
	} else if ('++' === last.value || '--' === last.value) {
		base = me.parseMathShorthandLeftOperator(flowContext, '(' === me.previousToken.value);
	} else if ('(' === last.value) {
		me.next();
		base = me.parseExpectedExpression(flowContext, true);
		me.expect(')');
	} else if (validator.isNonNilLiteral(last.type)) {
		base = me.parseExpectedExpression(flowContext);
	} else if ('[' === me.token.value || '{' === last.value) {
		base = me.parseExpectedExpression(flowContext);
	} else {
		me.exception('Unexpected assignment or call');
	}

	while (TOKENS.Punctuator === me.token.type && '=' !== me.token.value && ';' !== me.token.value && '<eof>' !== me.token.value) {
		last = me.token;
		base = me.parseRighthandExpressionGreedy(base, flowContext);
	}

    if (';' === me.token.value || '<eof>' === me.token.value) {
    	if (validator.isLiteral(last.type)) {
    		return base;
    	}

		return AST.callStatement(base, mainStatementLine);
    }

    me.expect('=');

	const value = me.parseExpectedExpression(flowContext);

	return AST.assignmentStatement(base, value, mainStatementLine);
};

Parser.prototype.parseForStatement = function(flowContext) {
	const me = this;
	const mainStatementLine = me.token.line;
	me.consume('(');
	const variable = me.parseIdentifier();

	me.expect('in');
	const iterator = me.parseExpectedExpression(flowContext);
	me.consume(')')

	let body;
	if (TOKENS.EOL === me.token.type) {
		body = me.parseBlock(flowContext);
		me.expect('end for');
	} else {
		body = me.parseBlockShortcut(flowContext);
		me.expectMany(['end for', ';', '<eof>']);
	}

	return AST.forGenericStatement(variable, iterator, body, mainStatementLine);
};

Parser.prototype.parseFunctionDeclaration = function(flowContext, name) {
	const me = this;
	const mainStatementLine = me.token.line;
	const parameters = [];
	me.expect('(');

	if (!me.consume(')')) {
		while (true) {
			if (TOKENS.Identifier === me.token.type) {
				let parameter = me.parseIdentifier();
				const value = parameter.value;
				if (me.consume('=')) {
					const value = me.parseExpectedExpression(flowContext);
					parameter = AST.assignmentStatement(parameter, value, mainStatementLine);
				}
				parameters.push(parameter);
				if (me.consume(',')) continue;
			} else {
				me.exception('Unexpected parameter');
			}

			me.expect(')');
			break;
		}
	}

	let body;
	if (TOKENS.EOL === me.token.type) {
		body = me.parseBlock(flowContext);
		me.expect('end function');
	} else {
		body = me.parseBlockShortcut(flowContext);
		me.expectMany(['end function', ';', '<eof>']);
	}

	return AST.functionStatement(name, parameters, body, mainStatementLine);
};

Parser.prototype.parseStatement = function(flowContext, isShortcutStatement) {
	if (isShortcutStatement == null) isShortcutStatement = false;
	const me = this;

	if (TOKENS.Keyword === me.token.type) {
		const value = me.token.value;
		const statement = statements.call(me, value, flowContext, isShortcutStatement);

		if (statement) return statement;
	} else if (TOKENS.DebuggerOperator === me.token.type) {
		const base = AST.featureDebuggerExpression(me.token.lineStart);
		me.next();
		return base;
    } else if (TOKENS.EOL === me.token.type) {
    	me.next();
    	return null;
    }

    return me.parseAssignmentOrCallStatement(flowContext);
};

Parser.prototype.parseBlockShortcut = function(flowContext) {
	const me = this;
	const block = [];
	let statement;
	let value;

	flowContext.push(block);
	while (true) {
		value = me.token.value;
		if (TOKENS.EOL === me.token.type || validator.isBreakingBlockShortcutKeyword(value)) {
			break;
		}
		statement = me.parseStatement(flowContext, 'return' === value);
		if (statement) block.push(statement);
		if (TOKENS.EOL === me.token.type) {
			break;
		}
		me.consume(';');
	}
	flowContext.pop();

	return block;
};

Parser.prototype.parseBlock = function(flowContext) {
	const me = this;
	const block = [];
	let statement;
	let value;

	flowContext.push(block);
	while (!me.isBlockFollow(me.token)) {
		value = me.token.value;
		statement = me.parseStatement(flowContext);
		me.consume(';');
		if (statement) block.push(statement);
	}
	flowContext.pop();

	return block;
};

Parser.prototype.parseChunk = function() {
	const me = this;
	me.next();
	const mainStatementLine = me.token.line;
	const body = me.parseBlock(new Stack());
	if (TOKENS.EOF !== me.token.type) {
		me.exception('Unexpected EOF');
	}
	return AST.chunk(body, me.imports, me.includes, Object.keys(me.namespaces), mainStatementLine);
};

Parser.prototype.exception = function(message) {
	const me = this;
	throw new Error('Error: ' + message + ' with token ' + JSON.stringify(me.token));
}

module.exports = Parser;
