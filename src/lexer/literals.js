const TOKENS = require('./tokens');

exports.NON_NIL_LITERALS = [TOKENS.StringLiteral, TOKENS.NumericLiteral, TOKENS.BooleanLiteral]
exports.LITERALS = [TOKENS.StringLiteral, TOKENS.NumericLiteral, TOKENS.BooleanLiteral, TOKENS.NilLiteral]