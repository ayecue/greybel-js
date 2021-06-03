const Lexer = require('./lexer');
const TOKENS = require('./lexer/tokens');
const CHAR_CODES = require('./lexer/codes');
const LITERAL_MAPS = require('./lexer/literals');
const NON_NIL_LITERALS = LITERAL_MAPS.NON_NIL_LITERALS;
const LITERALS = LITERAL_MAPS.LITERALS;
const FlowContext = require('./parser/flow-context');
const AST = require('./parser/ast');
const util = require('util');
const varNamespaces = require('./build/var-namespaces');
const literals = require('./build/literals');
const envs = require('./build/envs');
const NATIVE_FUNCTIONS = ['abs', 'floor', 'range', 'round', 'sign', 'str', 'ceil', 'acos', 'asin', 'atan', 'tan', 'cos', 'sin','launch_path', 'hasIndex', 'rnd', 'slice', 'pi', 'typeof', 'self', 'params', 'char', 'globals', 'locals', 'print', 'wait', 'time', 'typeof', 'md5', 'get_router', 'get_shell', 'nslookup', 'whois', 'is_valid_ip', 'is_lan_ip', 'command_info', 'current_date', 'current_path', 'parent_path', 'home_dir', 'program_path', 'active_user', 'user_mail_address', 'user_bank_number', 'format_columns', 'user_input', 'include_lib', 'bitwise', 'clear_screen', 'exit'];

const Parser = function(content, collectAll) {
	const me = this;

	me.content = content;
	me.lexer = new Lexer(content);
	me.lookahead = me.lexer.next();
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

	me.previousToken = me.token;
	me.token = me.lookahead;
	me.lookahead = me.lexer.next();

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
	if (TOKENS.Punctuator === type) return '@:'.indexOf(value) >= 0;
	if (TOKENS.Keyword === type) return 'not' === value || 'new' === value;
	return false;
};

Parser.prototype.parseIdentifier = function() {
	const me = this;
	const identifier = me.token.value;
	if (TOKENS.Identifier === me.token.type) {
		if (me.collectAll && !me.namespaces.hasOwnProperty(identifier) && NATIVE_FUNCTIONS.indexOf(identifier) === -1) {
			me.namespaces[identifier] = true;
			varNamespaces.createNamespace(identifier);
		}
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
		if (TOKENS.StringLiteral === me.token.type && ':' === me.lookahead.value) {
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
	return AST.mapConstructorExpression(fields);
};

Parser.prototype.parseListConstructor = function(flowContext) {
	const me = this;
	const fields = []
	let key;
	let value;

	while (true) {
		value = me.parseExpression(flowContext)
		if (null == value) break;
		fields.push(AST.listValue(value));
		if (',;'.indexOf(me.token.value) >= 0) {
			me.next();
			continue;
		}
	  	break;
	}
	me.expect(']');
	return AST.listConstructorExpression(fields);
};

Parser.prototype.parsePrefixExpression = function(flowContext) {
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

    while (true) {
      const newBase = me.parsePrefixExpressionPart(base, flowContext);
      if (newBase === null) break;
      base = newBase;
    }

    return base;
};

Parser.prototype.parseMathShorthandLeftOperator = function(flowContext) {
	const me = this;
	const operator = me.token.value.charAt(0);
	me.next();
	const base = me.parseExpectedExpression(flowContext);
	const number = AST.literal('NumericLiteral', 1, 1);
	return AST.binaryExpression(operator, number, base);
};

Parser.prototype.parseMathShorthandRightOperator = function(base) {
	const me = this;
	const operator = me.previousToken.value.charAt(0);
	const number = AST.literal('NumericLiteral', 1, 1);
	return AST.binaryExpression(operator, base, number);
};

Parser.prototype.parseAssignmentShorthandOperator = function(base, flowContext) {
	const me = this;
	const operator = me.previousToken.value.charAt(0);
	const value = me.parseSubExpression(0, flowContext);
	const expression = AST.binaryExpression(operator, base, value);
	return AST.assignmentStatement([base], expression);
};

Parser.prototype.parseBitwiseOperator = function(base, flowContext) {
	const me = this;
	const operator = me.previousToken.value;
	const operationArg = AST.literal('StringLiteral', operator, '"' + operator + '"');
	const lastArg = me.parseSubExpression(0, flowContext);
	const fn = AST.identifier('bitwise');
	return AST.callExpression(fn, [operationArg, base, lastArg]);
};

Parser.prototype.parsePrefixExpressionPart = function(base, flowContext) {
	const me = this;
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
		} else if ('<<' === value || '>>' === value || '>>>' === value || '|' === value || '&' === value || '^' === value) {
			me.next();
			return  me.parseBitwiseOperator(base, flowContext);
		} else if ('[' === value) {
			me.next();
			expression = me.parseExpectedExpression(flowContext);
			me.expect(']');
			return AST.indexExpression(base, expression);
    	} else if ('.' === value) {
			me.next();
			identifier = me.parseIdentifier();
			return AST.memberExpression(base, '.', identifier);
		} else if ('(' === value) {
			return me.parseCallExpression(base, flowContext);
		}
	} else if (TOKENS.StringLiteral === type) {
		return me.parseCallExpression(base, flowContext);
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
			return AST.callExpression(base, expressions);
		}
	}

	me.exception('Unexpected arguments');
};

Parser.prototype.parsePrimaryExpression = function(flowContext) {
	const me = this;
	const value = me.token.value;
	const type = me.token.type;

	if (LITERALS.indexOf(type) != -1) {
		const raw = me.content.slice(me.token.range[0], me.token.range[1]);
		let base = AST.literal(type, value, raw);

		if (me.collectAll) literals.add(base);

		if (TOKENS.NilLiteral !== type && me.lookahead.value === '.') {
			me.next();
			while (true) {
				const newBase = me.parsePrefixExpressionPart(base, flowContext);
				if (newBase === null) break;
				base = newBase;
			}
		} else {
			me.next();
		}

		return base;
	} else if (TOKENS.Keyword === type && '#envar' === value) {
		me.next();
		return me.parseFeatureEnvarStatement(flowContext);
	} else if (TOKENS.Keyword === type && 'function' === value) {
		me.next();
		return me.parseFunctionDeclaration(null);
	} else if (me.consumeMany(['{', '['])) {
		let base;
		if ('{' === value) {
			base = me.parseMapConstructor(flowContext);
		} else {
			base = me.parseListConstructor(flowContext);
		}

		if (me.token.value === '.') {
			while (true) {
				const newBase = me.parsePrefixExpressionPart(base, flowContext);
				if (newBase === null) break;
				base = newBase;
			}
		}

		return base;
	}
};

Parser.prototype.parseSubExpression = function (minPrecedence, flowContext, isWrapped) {
	const me = this;
    let operator = me.token.value;
    let expression = null;

    if (me.isUnary(me.token)) {
		me.next();
		const argument = me.parseSubExpression(10, flowContext);
		expression = AST.unaryExpression(operator, argument);
    } else if (operator === '++' || operator === '--') {
		expression = me.parseMathShorthandLeftOperator(flowContext);
    }
    if (null == expression) {
      expression = me.parsePrimaryExpression(flowContext);

      if (null == expression) {
        expression = me.parsePrefixExpression(flowContext);
      }
    }

    let precedence;
	while (true) {
		operator = me.token.value;
		precedence = 0;

		if (TOKENS.Punctuator === me.token.type || TOKENS.Keyword === me.token.type) {
			precedence = me.binaryPrecedence(operator);
		}

		if (precedence === 0 || precedence <= minPrecedence) break;
		me.next();
		let right = me.parseSubExpression(precedence, flowContext);
		if (null == right) {
			right = AST.emptyExpression();
		}

		expression = AST.binaryExpression(operator, expression, right, isWrapped);
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
	const path = me.parseFeaturePath();
	me.expect(';');
	const base = AST.featureIncludeExpression(path);
	me.includes.push(base);
	return base;
};

Parser.prototype.parseFeatureImportStatement = function() {
	const me = this;
	const name = me.parseIdentifier();
	me.expect('from');
	const path = me.parseFeaturePath();
	me.expect(';');
	const base = AST.featureImportExpression(name, path);
	me.imports.push(base);
	return base;
};

Parser.prototype.parseFeatureEnvarNameStatement = function() {
	const me = this;
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

	const literal = AST.literal(type, value, raw);

	if (me.collectAll) literals.add(literal);
	me.next();
	return literal;
};

Parser.prototype.parseFeatureEnvarStatement = function(flowContext) {
	const me = this;
	const name = me.parseFeatureEnvarNameStatement();
	me.expect(';');
	let base = AST.featureEnvarExpression(name);
	if ('.' === me.token.value) {
		while (true) {
			const newBase = me.parsePrefixExpressionPart(base, flowContext);
			if (newBase === null) break;
			base = newBase;
		}
	}
	return base;
};


Parser.prototype.parseWhileStatement = function(flowContext) {
	const me = this;
	const condition = me.parseExpectedExpression(flowContext);
	flowContext.pushScope(true);
	const body = me.parseBlock(flowContext);
	flowContext.popScope();
	me.expect('end while');
	return AST.whileStatement(condition, body);
};

Parser.prototype.parseExpression = function(flowContext, isWrapped) {
	const me = this;
	const expression = me.parseSubExpression(0, flowContext, isWrapped);
	return expression;
};

Parser.prototype.parseExpectedExpression = function(flowContext, isWrapped) {
	const me = this;
	const expression = me.parseExpression(flowContext, isWrapped);
	if (expression != null) return expression;
	me.exception('Unexpected expression');
};

Parser.prototype.parseIfShortcutStatement = function(flowContext, condition) {
	const me = this;
	const clauses = [];
	let statement;

	statement = me.parseStatement(flowContext, true);
	clauses.push(AST.ifShortcutClause(condition, statement));

    while (me.consume('else if')) {
		condition = me.parseExpectedExpression(flowContext);
		me.expect('then');
		statement = me.parseStatement(flowContext, true);
		clauses.push(AST.elseifShortcutClause(condition, statement));
	}

	if (me.consume('else')) {
		statement = me.parseStatement(flowContext, true);
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

	flowContext.pushScope();
	body = me.parseBlock(flowContext);
	flowContext.popScope();
	clauses.push(AST.ifClause(condition, body));

	while (me.consume('else if')) {
		condition = me.parseExpectedExpression(flowContext);
		me.expect('then');
		flowContext.pushScope();
		body = me.parseBlock(flowContext);
		flowContext.popScope();
		clauses.push(AST.elseifClause(condition, body));
	}

	if (me.consume('else')) {
		flowContext.pushScope();
		body = me.parseBlock(flowContext);
		flowContext.popScope();
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

const BINARY_PRECEDENCE_MAP = {
	'1': {
		[CHAR_CODES.CARET]: 12,
		[CHAR_CODES.ASTERISK]: 10,
		[CHAR_CODES.SLASH]: 10,
		[CHAR_CODES.PERCENT]: 10,
		[CHAR_CODES.PLUS]: 9,
		[CHAR_CODES.MINUS]: 9,
		[CHAR_CODES.ARROW_LEFT]: 3,
		[CHAR_CODES.ARROW_RIGHT]: 3,
		[CHAR_CODES.COLON]: 9
	},
	'2': {
		[CHAR_CODES.ARROW_LEFT]: 3,
		[CHAR_CODES.ARROW_RIGHT]: 3,
		[CHAR_CODES.EQUAL]: 3,
		[CHAR_CODES.EXCLAMATION_MARK]: 3,
		'111': 1 // or
	},
	'3': {
		'97': 2 // and
		//'110': 2 // not
	}
};


Parser.prototype.binaryPrecedence = function(operator) {
    const code = operator.charCodeAt(0);
    const length = operator.length;
    const values = BINARY_PRECEDENCE_MAP[length];

    if (values) {
    	const value = values[code];
    	
    	if (value) {
    		if (length === 3 && 'and' === operator) return value;
    		else if (length < 3) return value;
    	}
    }

    return 0;
};

Parser.prototype.parseAssignmentOrCallStatement = function(flowContext) {
    const me = this;
    let lvalue;
    let base;
    let last;

    const targets = [];

    while (true) {
    	last = me.token;

    	if (TOKENS.Identifier === last.type) {
			base = me.parseIdentifier();
			lvalue = true;
		} else if ('++' === last.value || '--' === last.value) {
			base = me.parseMathShorthandLeftOperator(flowContext);
			lvalue = null;
		} else if ('(' === last.value) {
			me.next();
			base = me.parseExpectedExpression(flowContext, true);
			me.expect(')');
			lvalue = false;
		} else if (NON_NIL_LITERALS.indexOf(last.type) !== -1) {
			base = me.parseExpectedExpression(flowContext);
			lvalue = null;
		} else if ('[' === me.token.value || '{' === last.value) {
			base = me.parseExpectedExpression(flowContext);
			lvalue = null;
		} else {
			me.exception('Unexpected assignment or call');
		}

		while (true) {
			let value = me.token.value;

			if (TOKENS.StringLiteral === me.token.type) value = '"';

			if ('.' === value || '[' === value) {
				lvalue = true;
			} else if ('(' === value || '{' === value || '"' === value || '++' === value || '--' === value || '+=' === value || '-=' === value || '<<' === value || '>>' === value || '>>>' === value || '|' === value || '&' === value || '^' === value || '*=' === value || '/=' === value) {
				lvalue = null;
			} else {
				break;
			}

			last = me.token;
			base = me.parsePrefixExpressionPart(base, flowContext);
		}

		targets.push(base);

		if (',' !== me.token.value) {
			break;
		}

		if (!lvalue) {
			me.exception('Unexpected token');
		}

		me.next();
    }

    if (targets.length === 1 && (lvalue === null || me.consume(';') || me.consume('<eof>'))) {
    	const target = targets[0];

    	if (LITERALS.indexOf(last.type) !== -1) {
    		return target;
    	}

		return AST.callStatement(target);
    } else if (!lvalue) {
		me.exception('Unexpected token');
    }

    me.expect('=');

	const value = me.parseExpectedExpression(flowContext);

	return AST.assignmentStatement(targets, value);
};

Parser.prototype.parseForStatement = function(flowContext) {
	const me = this;
	const variable = me.parseIdentifier();

	me.expect('in');
	const iterator = me.parseExpectedExpression(flowContext);
	flowContext.pushScope(true);
	const body = me.parseBlock(flowContext);
	flowContext.popScope();
	me.expect('end for');

	return AST.forGenericStatement(variable, iterator, body);
};

Parser.prototype.parseFunctionDeclaration = function(name, isLocal) {
	const me = this;
	const flowContext = new FlowContext();
	flowContext.pushScope();

	const parameters = [];
	me.expect('(');

	if (!me.consume(')')) {
		while (true) {
			if (TOKENS.Identifier === me.token.type) {
				let parameter = me.parseIdentifier();
				const value = parameter.value;
				if (me.consume('=')) {
					const value = me.parseExpectedExpression(flowContext);
					parameter = AST.assignmentStatement([parameter], value);
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

	const body = me.parseBlock(flowContext);
	flowContext.popScope();
	me.expect('end function');

	if (isLocal == null) isLocal = false;
	return AST.functionStatement(name, parameters, isLocal, body);
};

Parser.prototype.parseStatement = function(flowContext, isShortcutStatement) {
	if (isShortcutStatement == null) isShortcutStatement = false;
	const me = this;
	let value;

	if (TOKENS.Keyword === me.token.type) {
		value = me.token.value;

		if ('if' === value) {
			me.next();
			return me.parseIfStatement(flowContext);
		} else if ('return' === value) {
			me.next();
			return me.parseReturnStatement(flowContext, isShortcutStatement);
		} else if ('function' === value) {
			me.next();
			const name = me.parseFunctionName();
			return me.parseFunctionDeclaration(name);
		} else if ('while' === value) {
			me.next();
			return me.parseWhileStatement(flowContext);
		} else if ('for' === value) {
			me.next();
			return me.parseForStatement(flowContext);
		} else if ('continue' === value) {
			me.next();
			return AST.continueStatement();
		} else if ('break' === value) {
			me.next();
			return AST.breakStatement();
		} else if ('#include' === value) {
			me.next();
			return me.parseFeatureIncludeStatement();
		} else if ('#import' === value) {
			me.next();
			return me.parseFeatureImportStatement();
		} else if ('#envar' === value) {
			me.next();
			return me.parseFeatureEnvarStatement(flowContext);
		}
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

    return block;
};

Parser.prototype.parseChunk = function() {
	const me = this;
	me.next();
	const flowContext = new FlowContext();
	flowContext.pushScope();
	const body = me.parseBlock(flowContext);
	flowContext.popScope();
	if (TOKENS.EOF !== me.token.type) {
		me.exception('Unexpected EOF');
	}
	return AST.chunk(body, me.imports, me.includes, Object.keys(me.namespaces));
};

Parser.prototype.exception = function(message) {
	const me = this;
	throw new Error('Error: ' + message + ' with token ' + JSON.stringify(me.token));
}

module.exports = Parser;
