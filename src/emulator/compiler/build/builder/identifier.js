const logger = require('node-color-log');

const mapper = function(make, stack, depth, context) {
	const identifiers = [];
	context.identifiers = identifiers;

	return {
		'AssignmentStatement': function(item) {
			throw new Error('Not supported');
		},
		'MemberExpression': function(item) {
			identifiers.push(item);
			return item;
		},
		'FunctionDeclaration': function(item) {
			throw new Error('Not supported');
		},
		'MapConstructorExpression': function(item) {
			identifiers.push(item);
			return item;
		},
		'MapKeyString': function(item) {
			throw new Error('Should not reach');
		},
		'Identifier': function(item) {
			identifiers.push(item);
			return item;
		},
		'ReturnStatement': function(item) {
			throw new Error('Not supported');
		},
		'NumericLiteral': function(item) {
			identifiers.push(item);
			return item;
		},
		'WhileStatement': function(item) {
			throw new Error('Not supported');
		},
		'BinaryExpression': function(item) {
			make(item.left);
			make(item.right);
			return item;
		},
		'CallExpression': function(item) {
			identifiers.push(item);
			return item;
		},
		'StringLiteral': function(item) {
			identifiers.push(item);
			return item;
		},
		'IndexExpression': function(item) {
			identifiers.push(item);
			return item;
		},
		'UnaryExpression': function(item) {
			identifiers.push(item);
			return item;
		},
		'IfShortcutStatement': function(item) {
			return null;
		},
		'IfShortcutClause': function(item) {
			return null;
		},
		'ElseifShortcutClause': function(item) {
			return null;
		},
		'ElseShortcutClause': function(item) {
			return null;
		},
		'NilLiteral': function(item) {
			identifiers.push(item);
			return item;
		},
		'ForGenericStatement': function(item) {
			return null;
		},
		'IfStatement': function(item) {
			return null;
		},
		'IfClause': function(item) {
			return null;
		},
		'ElseifClause': function(item) {
			return null;
		},
		'ElseClause': function(item) {
			return null;
		},
		'ContinueStatement': function(item) {
			return null;
		},
		'BreakStatement': function(item) {
			return null;
		},
		'CallStatement': function(item) {
			identifiers.push(item);
			return item;
		},
		'ListConstructorExpression': function(item) {
			identifiers.push(item);
			return item;
		},
		'ListValue': function(item) {
			return null;
		},
		'BooleanLiteral': function(item) {
			identifiers.push(item);
			return item;
		},
		'EmptyExpression': function(item) {
			return null;
		},
		'LogicalExpression': function(item) {
			make(item.left);
			make(item.right);
			return item;
		},
		'Chunk': function(item) {
			return null;
		},
		'CustomConditionOrBinaryExpression': function(item) {
			identifiers.push(item);
			return item;
		}
	};
};

module.exports = mapper;