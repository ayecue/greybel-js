const logger = require('node-color-log');

const mapper = function(make, stack, depth, context) {
	return {
		'AssignmentStatement': function(item) {
			const varibale = item.variable;
			const init = item.init;
			const left = make(varibale);
			const right = make(init);

			return `${left}=${right}`;
		},
		'MemberExpression': function(item) {
			const identifier = make(item.identifier);
			const base = make(item.base);

			return `${base}${item.indexer}${identifier}`;
		},
		'FunctionDeclaration': function(item) {
			let name = '';
			const identifier = make(item.identifier);
			if (identifier != null && identifier != '') name = identifier;
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

			return `function ${name} (${parameters.join(',')}) {
				const $LOCAL_MAP = {};
				const locals = () => $LOCAL_MAP;
				${body.join('\n')}
			}`;
		},
		'MapConstructorExpression': function(item) {
			const fields = [];
			let fieldItem;

			for (fieldItem of item.fields) {
				fields.push(make(fieldItem));
			}

			return `{${fields.join(',')}}`;
		},
		'MapKeyString': function(item) {
			const key = make(item.key);
			const value = make(item.value);

			return `${key}:${value}`;
		},
		'Identifier': function(item) {
			const name = item.name;
			return name;
		},
		'ReturnStatement': function(item) {
			const args = [];
			let argItem;

			for (argItem of item.arguments) {
				args.push(make(argItem));
			}

			return `return ${args.join(',')}`;
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

			return `while (${condition}) {
				${body.join('\n')}
			}`;
		},
		'BinaryExpression': function(item) {
			const left = make(item.left);
			const right = make(item.right);
			let leftWrapper = '';
			let rightWrapper = '';

			if (item.isWrapped) {
				leftWrapper = '(';
				rightWrapper = ')';
			}

			return `${leftWrapper}${left} ${item.operator} ${right}${rightWrapper}`;
		},
		'CallExpression': function(item) {
			const base = make(item.base);
			const args = [];
			let argItem;

			for (argItem of item.arguments) {
				args.push(make(argItem));
			}

			return `${base}(${args.join(',')})`;
		},
		'StringLiteral': function(item) {
			return `"${unescape(item.value)}"`;
		},
		'IndexExpression': function(item) {
			const base = make(item.base);
			const index = make(item.index);

			return `${base}[${index}]`;
		},
		'UnaryExpression': function(item) {
			const arg = make(item.argument);

			if ('@' === item.operator) return arg;
			if ('new' === item.operator) return `(${item.operator} ${arg})`;
			if ('not' === item.operator) return `!${arg}`;

			return `${item.operator}${arg}`;
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

			return `if (${condition}) {
				${statement}
			}`;
		},
		'ElseifShortcutClause': function(item) {
			const condition = make(item.condition);
			const statement = make(item.statement);

			return `else if (${condition}) {
				${statement}
			}`;
		},
		'ElseShortcutClause': function(item) {
			const statement = make(item.statement);

			return `else {
				${statement}
			}`;
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

			return `for (var ${variable} of ${iterator}) {
				${body.join('\n')}
			}`;
		},
		'IfStatement': function(item) {
			const clauses = [];
			let clausesItem;

			for (clausesItem of item.clauses) {
				clauses.push(make(clausesItem));
			}

			return clauses.join('\n');
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

			return `if (${condition}) {
				${body.join('\n')}
			}`;
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

			return `else if (${condition}) {
				${body.join('\n')}
			}`;
		},
		'ElseClause': function(item) {
			const body = [];
			let bodyItem;

			for (bodyItem of item.body) {
				const transformed = make(bodyItem);
				if ('' === transformed) continue;
				body.push(transformed);
			}

			return `else {
				${body.join('\n')}
			}`;
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
		'ListConstructorExpression': function(item) {
			const fields = [];
			let fieldItem;

			for (fieldItem of item.fields) {
				fields.push(make(fieldItem));
			}

			return `${fields.join(',')}`;
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
			let leftWrapper = '';
			let rightWrapper = '';

			if (item.isWrapped) {
				leftWrapper = '(';
				rightWrapper = ')';
			}

			return `${leftWrapper}${left} ${item.operator} ${right}${rightWrapper}`;
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
		},
		'CustomConditionOrBinaryExpression': function(item) {
			const identifier = Object.entries(item.identifier).reduce((result, [key, value]) => {
				result.push(`'${key}': function() { return (${make(value)}) }`);
				return result;
			}, []).join(',');

			return `CustomConditionOrBinaryExpression("${item.isNegative ? 'not ' : ''}${item.query}",{${identifier}})`;
		}
	};
};

module.exports = mapper;