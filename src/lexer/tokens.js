const TOKENS = {
	EOF: 1,
	StringLiteral: 2,
	Keyword: 4,
	Identifier: 8,
	NumericLiteral: 16,
	Punctuator: 32,
	BooleanLiteral: 64,
	NilLiteral: 128,
	EOL: 256
};

module.exports = TOKENS;