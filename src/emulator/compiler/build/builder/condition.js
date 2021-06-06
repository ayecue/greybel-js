const logger = require('node-color-log');
const md5 = require('../../../../utils/md5');

const uniqueId = (v) => md5(v).replace(/[0-9]/g, '');

const mapper = function(make, stack, depth, context) {
	return {
		'AssignmentStatement': function(item) {
			throw new Error('Not supported');
		},
		'MemberExpression': function(item) {
			const identifier = make(item.identifier);
			const base = make(item.base);

			return `${uniqueId(base + item.indexer + identifier)}`;
		},
		'FunctionDeclaration': function(item) {
			throw new Error('Not supported');
		},
		'MapConstructorExpression': function(item) {
			const fields = [];
			let fieldItem;

			for (fieldItem of item.fields) {
				fields.push(make(fieldItem));
			}

			return `${uniqueId(fields.join(','))}`;
		},
		'MapKeyString': function(item) {
			const key = make(item.key);
			const value = make(item.value);

			return `${uniqueId(key + value)}`;
		},
		'Identifier': function(item) {
			return uniqueId(item.name);
		},
		'ReturnStatement': function(item) {
			throw new Error('Not supported');
		},
		'NumericLiteral': function(item) {
			return `${uniqueId(item.value.toString())}`;
		},
		'WhileStatement': function(item) {
			throw new Error('Not supported');
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

			return `${uniqueId(base)}`;
		},
		'StringLiteral': function(item) {
			return `${uniqueId(item.value)}`;
		},
		'IndexExpression': function(item) {
			const base = make(item.base);
			const index = make(item.index);

			return `${uniqueId(base + index)}`;
		},
		'UnaryExpression': function(item) {
			const arg = make(item.argument);
			return `${item.operator}${uniqueId(arg)}`;
		},
		'IfShortcutStatement': function(item) {
			throw new Error('Not supported');
		},
		'IfShortcutClause': function(item) {
			throw new Error('Not supported');
		},
		'ElseifShortcutClause': function(item) {
			throw new Error('Not supported');
		},
		'ElseShortcutClause': function(item) {
			throw new Error('Not supported');
		},
		'NilLiteral': function(item) {
			return `${uniqueId('nil')}`;
		},
		'ForGenericStatement': function(item) {
			throw new Error('Not supported');
		},
		'IfStatement': function(item) {
			throw new Error('Not supported');
		},
		'IfClause': function(item) {
			throw new Error('Not supported');
		},
		'ElseifClause': function(item) {
			throw new Error('Not supported');
		},
		'ElseClause': function(item) {
			throw new Error('Not supported');
		},
		'ContinueStatement': function(item) {
			throw new Error('Not supported');
		},
		'BreakStatement': function(item) {
			throw new Error('Not supported');
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

			return `${uniqueId(fields.join(','))}`;
		},
		'ListValue': function(item) {
			return make(item.value);
		},
		'BooleanLiteral': function(item) {
			return uniqueId(item.raw ? 'true' : 'false');
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
			throw new Error('Not supported');
		},
		'CustomConditionOrBinaryExpression': function(item) {
			return `${uniqueId(item.query)}`;
		}
	};
};

module.exports = mapper;