const Lexer = require('./lexer');
const TOKENS = require('./lexer/tokens');
const Stack = require('../../utils/stack');
const AST = require('./parser/ast');
const util = require('util');
const validator = require('./parser/validator');
const logger = require('node-color-log');
const statements = require('./parser/statements');
const conditionMapper = require('./build/builder/condition');
const identifierMapper = require('./build/builder/identifier');
const Tranformer = require('./build/builder/transformer');

const Parser = function(content, collectAll) {
	const me = this;

	me.content = content;
	me.lexer = new Lexer(content);
	me.history = [];
	me.prefetchedTokens = [];
	me.token = null;
	me.previousToken = null;
	me.declaredFunctionMap = {};

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
	if (TOKENS.Punctuator === type) return '@'.indexOf(value) >= 0;
	if (TOKENS.Keyword === type) return 'not' === value || 'new' === value;
	return false;
};

Parser.prototype.parseIdentifier = function() {
	const me = this;
	const identifier = me.token.value;
	if (TOKENS.Identifier === me.token.type) {
		me.next();
		return AST.identifier(identifier);
	}
	me.exception('Unexpected identifier');
};

Parser.prototype.parseMapConstructor = function(flowContext) {
	const me = this;
	const fields = []
	let key;
	let value;

	while (true) {
		if (TOKENS.StringLiteral === me.token.type && ':' === me.prefetch(1).value) {
	        key = me.parsePrimaryExpression();
			me.next();
			value = me.parseExpectedExpression(flowContext);
			fields.push(AST.mapKeyString(key, value));
	  	}
		if (',;'.indexOf(me.token.value) >= 0) {
			me.next();
			continue;
		}
	  	break;
	}
	me.expect('}');

	const map = AST.mapConstructorExpression(fields);
	const mapWrapperFunctionName = AST.identifier('CustomMap');
	const mapWrapperFunction = AST.callExpression(mapWrapperFunctionName, [map]);

	return mapWrapperFunction;
};

Parser.prototype.parseListConstructor = function(flowContext) {
	const me = this;
	const fields = []
	let key;
	let value;

	while (true) {
		value = me.parseExpression(flowContext)
		if (value != null) fields.push(AST.listValue(value));
		if (',;'.indexOf(me.token.value) >= 0) {
			me.next();
			continue;
		}
	  	break;
	}
	me.expect(']');

	const list = AST.listConstructorExpression(fields);
	const listWrapperFunctionName = AST.identifier('CustomList');
	const listWrapperFunction = AST.callExpression(listWrapperFunctionName, [list]);

	return listWrapperFunction;
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
    const value = me.token.value;

    if (TOKENS.Identifier === me.token.type) {
		base = me.parseIdentifier();

		if ((validator.isNative(value) || me.declaredFunctionMap[value]) && me.token.value !== '(') {
			base = AST.callExpression(base, []);
		}
    } else if (me.consume('(')) {
		base = me.parseExpectedExpression(flowContext, true, validator.isExpressionOperator(value));
		me.expect(')');
    } else {
      return null;
    }

	return me.parseRighthandExpressionGreedy(base, flowContext);
};

Parser.prototype.parseRighthandExpressionPart = function(base, flowContext) {
	const me = this;
    let expression;
    let identifier;
    const type = me.token.type;

    if (TOKENS.Punctuator === type) {
    	const value = me.token.value;

    	if ('[' === value) {
			me.next();
			let offset = 1;
			let token = me.token;
			while (true) {
				if (token.value === ']') break;
				if (token.value === ':') {
					let leftExpression;
					let rightExpression;

					if (!me.consume(':')) {
						leftExpression = me.parseExpectedExpression(flowContext);
						me.expect(':');
					} else {
						leftExpression = AST.literal('NumericLiteral', 0, 0);
					}

					if (!me.consume(']')) {
						rightExpression = me.parseExpectedExpression(flowContext);
						me.expect(']');
					} else {
						rightExpression = AST.emptyExpression();
					}

					const sliceIdentifier = AST.identifier('slice');
					base = AST.memberExpression(base, '.', sliceIdentifier);

					return AST.callExpression(base, [leftExpression, rightExpression]);
				}

				token = me.prefetch(offset++);
			}
			expression = me.parseExpectedExpression(flowContext);
			me.expect(']');

			if (base.type === 'CallExpression' && base.base.type === 'Identifier' && base.base.name === 'params') {
				const getIdentifier = AST.identifier('get');
				base = AST.memberExpression(base, '.', getIdentifier);

				return AST.callExpression(base, [expression])
			}

			return AST.indexExpression(base, expression);
    	} else if ('.' === value) {
			me.next();
			identifier = me.parseIdentifier();
			return AST.memberExpression(base, '.', identifier);
		} else if ('(' === value) {
			return me.parseCallExpression(base, flowContext);
		}
	}

	return null;
};

Parser.prototype.parseCallExpression = function(base, flowContext) {
	const me = this;

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
			return AST.callExpression(base, expressions, base.name === 'get_shell' || base.name === 'user_input');
		}
	}

	me.exception('Unexpected arguments');
};

Parser.prototype.parseFloatExpression = function(baseValue) {
	if (baseValue === 0) baseValue = '';
	const me = this;
	me.next();
	const floatValue = [baseValue, me.token.value].join('.');
	me.next();
	const base = AST.literal(TOKENS.NumericLiteral, floatValue, floatValue);
	return base;
};

Parser.prototype.parsePrimaryExpression = function(flowContext) {
	const me = this;
	const value = me.token.value;
	const type = me.token.type;

	if (validator.isLiteral(type)) {
		const raw = me.content.slice(me.token.range[0], me.token.range[1]);
		let base = AST.literal(type, value, raw);

		if (TOKENS.NilLiteral !== type && me.prefetch(1).value === '.') {
			me.next();
			if (TOKENS.NumericLiteral === type && TOKENS.NumericLiteral === me.prefetch(1).type) {
				base = me.parseFloatExpression(value);
			}
		} else {
			me.next();
		}

		return base;
	} else if ('.' === value && TOKENS.NumericLiteral === me.prefetch(1).type) {
		return me.parseFloatExpression(0);
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

Parser.prototype.parseSubExpression = function (flowContext, isWrapped, isInBinaryExpression) {
	const me = this;
    let operator = me.token.value;
    let expression = null;

    if (me.isUnary(me.token)) {
		me.next();
		const argument = me.parseSubExpression(flowContext, isWrapped, isInBinaryExpression);

		if (operator === 'not' && argument.type === 'CustomConditionOrBinaryExpression') {
			argument.isNegative = true;
			expression = argument;
		} else {
			expression = AST.unaryExpression(operator, argument);
		}
    }
    if (null == expression) {
		expression = me.parsePrimaryExpression(flowContext);

		if (null == expression) {
			expression = me.parseRighthandExpression(flowContext);

			if (expression != null && expression.type === 'CallExpression' && operator === '@') {
				if (expression.args.length > 0) {
					me.exception('Cannot call identifier if reference');
				}

				expression = expression.base;
			}
		}
    }

    const parentExpression = expression;

	while (true) {
		operator = me.token.value;
		if (!validator.isExpressionOperator(me.token.value)) break;

		me.next();
		let right = me.parseSubExpression(flowContext, null, true);
		if (null == right) {
			right = AST.emptyExpression();
		}

		expression = AST.binaryExpression(operator, expression, right, isWrapped);
	}

	if (
		!isInBinaryExpression && 
		expression &&
		(expression.type === 'BinaryExpression' || expression.type === 'LogicalExpression')
	) {
		const cTransformer = new Tranformer(conditionMapper);
		const iTransformer = new Tranformer(identifierMapper);

		iTransformer.make(expression);
		const identifiers = iTransformer.context.identifiers.reduce(function(result, item) {
			const name = cTransformer.make(item);

			return  {
				...result,
				[name]: item
			};
		}, {});
		const expressionString = cTransformer.make(expression);

		return AST.customConditionOrBinaryExpression(expressionString, identifiers);
	}

    return expression;
};

Parser.prototype.parseWhileStatement = function(flowContext) {
	const me = this;
	const condition = me.parseExpectedExpression(flowContext);

	let body;

	body = me.parseBlock(flowContext);
	me.expect('end while');

	return AST.whileStatement(condition, body);
};

Parser.prototype.parseExpression = function(flowContext, isWrapped, isInBinaryExpression) {
	const me = this;
	const expression = me.parseSubExpression(flowContext, isWrapped, isInBinaryExpression);
	return expression;
};

Parser.prototype.parseExpectedExpression = function(flowContext, isWrapped, isInBinaryExpression) {
	const me = this;
	const expression = me.parseExpression(flowContext, isWrapped, isInBinaryExpression);
	if (expression != null) return expression;
	me.exception('Unexpected expression');
};

Parser.prototype.parseIfShortcutStatement = function(flowContext, condition) {
	const me = this;
	const clauses = [];
	let statement;

	statement = me.parseStatement(flowContext);
	clauses.push(AST.ifShortcutClause(condition, statement));

    while (me.consume('else if')) {
		condition = me.parseExpectedExpression(flowContext);
		me.expect('then');
		statement = me.parseStatement(flowContext);
		clauses.push(AST.elseifShortcutClause(condition, statement));
	}

	if (me.consume('else')) {
		statement = me.parseStatement(flowContext);
		clauses.push(AST.elseShortcutClause(statement));
	}

	me.consumeMany([';', '<eof>']);

	return AST.ifShortcutStatement(clauses);
}

Parser.prototype.parseIfStatement = function(flowContext) {
	const me = this;
	const clauses = [];
	let condition;
	let body;

	condition = me.parseExpectedExpression(flowContext);
	me.expect('then');

	if (TOKENS.EOL !== me.token.type) return me.parseIfShortcutStatement(flowContext, condition);

	body = me.parseBlock(flowContext);
	clauses.push(AST.ifClause(condition, body));

	while (me.consume('else if')) {
		condition = me.parseExpectedExpression(flowContext);
		me.expect('then');
		body = me.parseBlock(flowContext);
		clauses.push(AST.elseifClause(condition, body));
	}

	if (me.consume('else')) {
		body = me.parseBlock(flowContext);
		clauses.push(AST.elseClause(body));
	}

	me.expect('end if');

	return AST.ifStatement(clauses);
};

Parser.prototype.parseReturnStatement = function(flowContext, isShortcutStatement) {
	const me = this;
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

	return AST.returnStatement(expressions);
};

Parser.prototype.parseFunctionName = function() {
	const me = this;
    let base;
    let name;
    let marker;

    base = me.parseIdentifier();

    while (me.consume('.')) {
		name = me.parseIdentifier();
		base = AST.memberExpression(base, '.', name);
    }

	return base;
};

Parser.prototype.parseAssignmentOrCallStatement = function(flowContext) {
    const me = this;
    let base;
    let last = me.token;

	if (TOKENS.Identifier === last.type) {
		base = me.parseIdentifier();
	} else if ('(' === last.value) {
		const previousToken = me.previousToken;
		me.next();
		base = me.parseExpectedExpression(flowContext, true, validator.isExpressionOperator(previousToken.value));
		me.expect(')');
	} else if (validator.isNonNilLiteral(last.type)) {
		base = me.parseExpectedExpression(flowContext);
	} else if ('[' === me.token.value || '{' === last.value) {
		base = me.parseExpectedExpression(flowContext);

		if (base.operator === ':') {
			me.exception('You cannot slice if there is no base value');
		}
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

		return AST.callStatement(base);
    }

    me.expect('=');

	const value = me.parseExpectedExpression(flowContext);

	if (value.type === 'FunctionDeclaration') {
		if (base.type === 'MemberExpression') {
			me.declaredFunctionMap[base.identifier] = true;
		} else {
			me.declaredFunctionMap[base.name] = true;
		}
	}

	return AST.assignmentStatement(base, value);
};

Parser.prototype.parseForStatement = function(flowContext) {
	const me = this;
	me.consume('(');
	const variable = me.parseIdentifier();

	me.expect('in');
	const iterator = me.parseExpectedExpression(flowContext);
	me.consume(')')

	let body;
	body = me.parseBlock(flowContext);
	me.expect('end for');

	return AST.forGenericStatement(variable, iterator, body);
};

Parser.prototype.parseFunctionDeclaration = function(flowContext, name) {
	const me = this;
	const parameters = [];
	me.expect('(');

	if (!me.consume(')')) {
		while (true) {
			if (TOKENS.Identifier === me.token.type) {
				let parameter = me.parseIdentifier();
				const value = parameter.value;
				if (me.consume('=')) {
					const value = me.parseExpectedExpression(flowContext);
					parameter = AST.assignmentStatement(parameter, value);
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
	body = me.parseBlock(flowContext);
	me.expect('end function');

	if (name) declaredFunctionMap[name] = true;

	return AST.functionStatement(name, parameters, body);
};

Parser.prototype.parseStatement = function(flowContext, isShortcutStatement) {
	if (isShortcutStatement == null) isShortcutStatement = false;
	const me = this;

	if (TOKENS.Keyword === me.token.type) {
		const value = me.token.value;
		const statement = statements.call(me, value, flowContext, isShortcutStatement);

		if (statement) return statement;
    } else if (TOKENS.EOL === me.token.type) {
    	me.next();
    	return null;
    }

    return me.parseAssignmentOrCallStatement(flowContext);
};

Parser.prototype.parseBlock = function(flowContext) {
	const me = this;
	const block = [];
	let statement;
	let value;

	flowContext.push(block);
	while (!me.isBlockFollow(me.token)) {
		value = me.token.value;
		if ('return' === value || 'break' === value) {
			block.push(me.parseStatement(flowContext));
			break;
		}
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
	const body = me.parseBlock(new Stack());
	if (TOKENS.EOF !== me.token.type) {
		me.exception('Unexpected EOF');
	}
	return AST.chunk(body);
};

Parser.prototype.exception = function(message) {
	const me = this;
	throw new Error('Error: ' + message + ' with token ' + JSON.stringify(me.token));
}

module.exports = Parser;
