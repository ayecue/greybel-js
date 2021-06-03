const BINARY_OPERATORS = [
	'<<','>>','>>>','|','&','^'
];

exports.BINARY_OPERATORS = BINARY_OPERATORS;

const EXPRESSION_OPERATORS = BINARY_OPERATORS.concat([
	'+', '*', '-', '/', '%', '<', '>', '<=', '>=', '!=', '==', 'or', 'and', ':'
]);

exports.EXPRESSION_OPERATORS = EXPRESSION_OPERATORS;