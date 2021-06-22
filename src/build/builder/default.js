const envs = require('../envs');
const logger = require('node-color-log');

const mapper = function(make, stack, depth, context) {
	return {
		'AssignmentStatement': function(item) {
			const varibale = item.variable;
			const init = item.init;
			const left = make(varibale);
			const right = make(init);

			return left + '=' + right;
		},
		'MemberExpression': function(item) {
			const identifier = make(item.identifier);
			const base = make(item.base);

			return [base, identifier].join(item.indexer);
		},
		'FunctionDeclaration': function(item) {
			let name = ' ';
			const identifier = make(item.identifier);
			if (identifier != null && identifier != '') name = ' ' + identifier;
			const parameters = [];
			const body = [];
			let parameterItem;
			let bodyItem;

			for (parameterItem of item.parameters) {
				parameters.push(make(parameterItem));
			}

			for (bodyItem of item.body) {
				const transformed = make(bodyItem);
				if ('' === transformed) continue;
				body.push(transformed);
			}

			return 'function' + name + '(' + parameters.join(',') + ')\n' + body.join('\n') + '\nend function';
		},
		'MapConstructorExpression': function(item) {
			const fields = [];
			let fieldItem;

			for (fieldItem of item.fields) {
				fields.push(make(fieldItem));
			}

			return '{' + fields.join(',') + '}';
		},
		'MapKeyString': function(item) {
			const key = make(item.key);
			const value = make(item.value);

			return [key, value].join(':')
		},
		'Identifier': function(item) {
			return item.name;
		},
		'ReturnStatement': function(item) {
			const args = [];
			let argItem;

			for (argItem of item.arguments) {
				args.push(make(argItem));
			}

			return 'return ' + args.join(',');
		},
		'NumericLiteral': function(item) {
			return item.value;
		},
		'WhileStatement': function(item) {
			const condition = make(item.condition);
			const body = [];
			let bodyItem;

			for (bodyItem of item.body) {
				const transformed = make(bodyItem);
				if ('' === transformed) continue;
				body.push(transformed);
			}

			return 'while (' + condition + ')\n' + body.join('\n') + '\nend while';
		},
		'CallExpression': function(item) {
			const base = make(item.base);
			const args = [];
			let argItem;

			for (argItem of item.arguments) {
				args.push(make(argItem));
			}

			return base + '(' + args.join(',') + ')';
		},
		'StringLiteral': function(item) {
			return item.raw;
		},
		'SliceExpression': function(item) {
			const left = make(item.left);
			const right = make(item.right);

			return [left, right].join(':');
		},
		'IndexExpression': function(item) {
			const base = make(item.base);
			const index = make(item.index);

			return base + '[' + index + ']';
		},
		'UnaryExpression': function(item) {
			const arg = make(item.argument);

			if ('new' === item.operator) return '(' + item.operator + ' ' + arg + ')';

			return item.operator + arg;
		},
		'NegationExpression': function(item) {
			const arg = make(item.argument);

			return 'not ' + arg;
		},
		'FeatureEnvarExpression': function(item) {
			const value = make(item.name);
			if (!value) return 'null';
			return value;
		},
		'IfShortcutStatement': function(item) {
			const clauses = [];
			let clausesItem;

			for (clausesItem of item.clauses) {
				clauses.push(make(clausesItem));
			}

			return clauses.join(' ');
		},
		'IfShortcutClause': function(item) {
			const condition = make(item.condition);
			const statement = make(item.statement);

			return 'if (' + condition + ') then ' + statement;
		},
		'ElseifShortcutClause': function(item) {
			const condition = make(item.condition);
			const statement = make(item.statement);

			return ' else if (' + condition + ') then ' + statement;
		},
		'ElseShortcutClause': function(item) {
			const statement = make(item.statement);

			return ' else ' + statement;
		},
		'NilLiteral': function(item) {
			return item.raw;
		},
		'ForGenericStatement': function(item) {
			const variable = make(item.variable);
			const iterator = make(item.iterator);
			const body = [];
			let bodyItem;

			for (bodyItem of item.body) {
				const transformed = make(bodyItem);
				if ('' === transformed) continue;
				body.push(transformed);
			}

			return 'for (' + variable + ' in ' + iterator + ')\n' + body.join('\n') + '\nend for';
		},
		'IfStatement': function(item) {
			const clauses = [];
			let clausesItem;

			for (clausesItem of item.clauses) {
				clauses.push(make(clausesItem));
			}

			return clauses.join('\n') + '\nend if';
		},
		'IfClause': function(item) {
			const condition = make(item.condition);
			const body = [];
			let bodyItem;

			for (bodyItem of item.body) {
				const transformed = make(bodyItem);
				if ('' === transformed) continue;
				body.push(transformed);
			}

			return 'if (' + condition + ') then\n' + body.join('\n');
		},
		'ElseifClause': function(item) {
			const condition = make(item.condition);
			const body = [];
			let bodyItem;

			for (bodyItem of item.body) {
				const transformed = make(bodyItem);
				if ('' === transformed) continue;
				body.push(transformed);
			}

			return 'else if (' + condition + ') then\n' + body.join('\n');
		},
		'ElseClause': function(item) {
			const body = [];
			let bodyItem;

			for (bodyItem of item.body) {
				const transformed = make(bodyItem);
				if ('' === transformed) continue;
				body.push(transformed);
			}

			return 'else\n' + body.join('\n');
		},
		'ContinueStatement': function(item) {
			return 'continue';
		},
		'BreakStatement': function(item) {
			return 'break';
		},
		'CallStatement': function(item) {
			return make(item.expression);
		},
		'FeatureImportExpression': function(item) {
			return make(item.name) + ' = __REQUIRE("' + item.namespace + '")';
		},
		'FeatureIncludeExpression': function(item) {
			return make(item.chunk);
		},
		'FeatureDebuggerExpression': function(item) {
			return '__debugger';
		},
		'ListConstructorExpression': function(item) {
			const fields = [];
			let fieldItem;

			for (fieldItem of item.fields) {
				fields.push(make(fieldItem));
			}

			return '[' + fields.join(',') + ']';
		},
		'ListValue': function(item) {
			return make(item.value);
		},
		'BooleanLiteral': function(item) {
			return item.raw;
		},
		'EmptyExpression': function(item) {
			return '';
		},
		'LogicalExpression': function(item) {
			const left = make(item.left);
			const right = make(item.right);
			let expression = [left, item.operator, right].join(' ');

			return '(' + expression + ')';
		},
		'BinaryExpression': function(item) {
			const left = make(item.left);
			const right = make(item.right);
			const operator = item.operator;
			let expression = [left, operator, right].join(' ');

			if (
				'<<' === operator ||
				'>>' === operator ||
				'>>>' === operator ||
				'|' === operator ||
				'&' === operator ||
				'^' === operator
			) {
				expression = 'bitwise('+ [ '"' + operator + '"', left, right].join(',') + ')';
			} else {
				expression = [left, operator, right].join(' ')
			}

			return '(' + expression + ')';
		},
		'Chunk': function(item) {
			const body = [];
			let bodyItem;

			for (bodyItem of item.body) {
				const transformed = make(bodyItem);
				if ('' === transformed) continue;
				body.push(transformed);
			}

			return body.join('\n');
		}
	};
};

module.exports = mapper;