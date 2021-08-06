const CHAR_CODES = require('./codes');

const KEYWORDS = {
	'2': ['if', 'in', 'or'],
	'3': ['and', 'end', 'for', 'not', 'new'],
	'4': ['else', 'then'],
	'5': ['break', 'while'],
	'6': ['return', '#envar'],
	'7': ['#import'],
	'8': ['function', 'continue', '#include'],
	'11': ['import_code']
};

exports.KEYWORDS = KEYWORDS;

exports.isKeyword = function(value) {
	const length = value.length;
	if (length in KEYWORDS) {
		return KEYWORDS[length].indexOf(value) != -1;
	}
	return false;
};

exports.isDebugger = function(value) {
	return value === '//debugger';
};

exports.isWhiteSpace = function(code) {
	return CHAR_CODES.WHITESPACE == code || CHAR_CODES.TAB == code;
};

exports.isEndOfLine = function(code) {
	return CHAR_CODES.NEW_LINE == code || CHAR_CODES.RETURN_LINE == code;
};

exports.isComment = function(code, nextCode) {
	return CHAR_CODES.SLASH == code && CHAR_CODES.SLASH == nextCode;
};

exports.isIdentifierStart = function (code) {
    return (code >= 65 && code <= 90) || (code >= 97 && code <= 122) || 95 === code || code >= 128 || code === CHAR_CODES.HASH;
};

exports.isIdentifierPart = function (code) {
    return (code >= 65 && code <= 90) || (code >= 97 && code <= 122) || 95 === code || (code >= 48 && code <= 57) || code >= 128;
};

exports.isDecDigit = function (code) {
	return code >= CHAR_CODES.NUMBERS[0] && code <= CHAR_CODES.NUMBERS[9];
};