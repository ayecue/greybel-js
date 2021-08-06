const AST = require('./ast');

const STATEMENT_MAP = {
	'if': function(flowContext) {
		return this.parseIfStatement(flowContext);
	},
	'return': function(flowContext, isShortcutStatement) {
		return this.parseReturnStatement(flowContext, isShortcutStatement);
	},
	'function': function(flowContext) {
		const name = this.parseFunctionName();
		return this.parseFunctionDeclaration(flowContext, name);
	},
	'while': function(flowContext) {
		return this.parseWhileStatement(flowContext);
	},
	'for': function(flowContext) {
		return this.parseForStatement(flowContext);
	},
	'continue': function() {
		return AST.continueStatement();
	},
	'break': function() {
		return AST.breakStatement();
	},
	'#include': function() {
		return this.parseFeatureIncludeStatement();
	},
	'#import': function() {
		return this.parseFeatureImportStatement();
	},
	'#envar': function(flowContext) {
		return this.parseFeatureEnvarStatement(flowContext);
	},
	'import_code': function() {
		return this.parseNativeImportCodeStatement();
	}
};

module.exports = function(value, flowContext, isShortcutStatement) {
	const me = this;
	const statementParser = STATEMENT_MAP[value];

	if (statementParser) {
		me.next();
		return statementParser.call(me, flowContext, isShortcutStatement);
	}
};