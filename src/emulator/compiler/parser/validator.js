const NATIVES = require('./natives');
const LITERAL_MAPS = require('../lexer/literals');
const NON_NIL_LITERALS = LITERAL_MAPS.NON_NIL_LITERALS;
const LITERALS = LITERAL_MAPS.LITERALS;
const OPERATORS = require('./operators');
const EXPRESSION_OPERATORS = OPERATORS.EXPRESSION_OPERATORS;

exports.isNative = function(value) {
	return NATIVES.indexOf(value) !== -1;
};

exports.isNonNilLiteral = function(type) {
	return NON_NIL_LITERALS.indexOf(type) !== -1;
};

exports.isLiteral = function(type) {
	return LITERALS.indexOf(type) !== -1;
};

exports.isExpressionOperator = function(value) {
	return EXPRESSION_OPERATORS.indexOf(value) !== -1;
};