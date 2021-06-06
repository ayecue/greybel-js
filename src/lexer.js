const validator = require('./lexer/validator');
const CHAR_CODES = require('./lexer/codes');
const TOKENS = require('./lexer/tokens');

const SCAN_MAP = {
	[CHAR_CODES.QUOTE]: function() {
		return this.scanStringLiteral();
	},
	[CHAR_CODES.DOT]: function(code, nextCode) {
		const me = this;
		if (validator.isDecDigit(code)) return me.scanNumericLiteral();
		if (CHAR_CODES.DOT === nextCode) return me.scanPunctuator('..');
        return me.scanPunctuator('.');
	},
	[CHAR_CODES.EQUAL]: function(code, nextCode) {
		const me = this;
		if (CHAR_CODES.EQUAL === nextCode) return me.scanPunctuator('==');
		return me.scanPunctuator('=');
	},
	[CHAR_CODES.ARROW_LEFT]: function(code, nextCode) {
		const me = this;
		if (CHAR_CODES.EQUAL === nextCode) return me.scanPunctuator('<=');
		if (CHAR_CODES.ARROW_LEFT === nextCode) return me.scanPunctuator('<<');
		return me.scanPunctuator('<');
	},
	[CHAR_CODES.ARROW_RIGHT]: function(code, nextCode, lastCode) {
		const me = this;
		if (CHAR_CODES.EQUAL === nextCode) return me.scanPunctuator('>=');
		if (CHAR_CODES.ARROW_RIGHT === nextCode) {
			if (CHAR_CODES.ARROW_RIGHT === lastCode) return me.scanPunctuator('>>>');
			return me.scanPunctuator('>>');
		}
		return me.scanPunctuator('>');
	},
	[CHAR_CODES.EXCLAMATION_MARK]: function(code, nextCode) {
		const me = this;
		if (CHAR_CODES.EQUAL === nextCode) return me.scanPunctuator('!=');
		
		return null;
	},
	[CHAR_CODES.MINUS]: function(code, nextCode) {
		const me = this;
		if (CHAR_CODES.EQUAL === nextCode) return me.scanPunctuator('-=');
		if (CHAR_CODES.MINUS === nextCode) return me.scanPunctuator('--');
		return me.scanPunctuator('-');
	},
	[CHAR_CODES.PLUS]: function(code, nextCode) {
		const me = this;
		if (CHAR_CODES.EQUAL === nextCode) return me.scanPunctuator('+=');
		if (CHAR_CODES.PLUS === nextCode) return me.scanPunctuator('++');
		return me.scanPunctuator('+');
	},
	[CHAR_CODES.ASTERISK]: function(code, nextCode) {
		const me = this;
		if (CHAR_CODES.EQUAL === nextCode) return me.scanPunctuator('*=');
		return me.scanPunctuator('*');
	},
	[CHAR_CODES.SLASH]: function(code, nextCode) {
		const me = this;
		if (CHAR_CODES.EQUAL === nextCode) return me.scanPunctuator('/=');
		return me.scanPunctuator('/');
	}
};

for (number of CHAR_CODES.NUMBERS) {
	SCAN_MAP[number] = function() {
		return this.scanNumericLiteral();
	}
}

const FALL_THROUGH = [
	CHAR_CODES.CARET,
	CHAR_CODES.PERCENT,
	CHAR_CODES.COMMA,
	CHAR_CODES.CURLY_BRACKET_LEFT,
	CHAR_CODES.CURLY_BRACKET_RIGHT,
	CHAR_CODES.SQUARE_BRACKETS_LEFT,
	CHAR_CODES.SQUARE_BRACKETS_RIGHT,
	CHAR_CODES.PARENTHESIS_LEFT,
	CHAR_CODES.PARENTHESIS_RIGHT,
	CHAR_CODES.SEMICOLON,
	CHAR_CODES.AT_SIGN,
	CHAR_CODES.COLON,
	CHAR_CODES.AMPERSAND,
	CHAR_CODES.VERTICAL_LINE
];

for (code of FALL_THROUGH) {
	SCAN_MAP[code] = function(code) {
		const me = this;
		return me.scanPunctuator(String.fromCharCode(code))
	}
}

const Lexer = function(content) {
	const me = this;

	me.content = content;
	me.length = content.length;
	me.index = 0;
	me.token = null;
	me.tokenStart = null;
	me.line = 1;
	me.lineStart = 0;

	return me;
};

Lexer.prototype.isNotEOF = function() {
	const me = this;
	return me.index < me.length;
};

Lexer.prototype.nextIndex = function(value) {
	if (value == null) value = 1
	const me = this;
	me.index = me.index + value;
	return me.index;
};

Lexer.prototype.codeAt = function(offset) {
	if (offset == null) offset = 0;
	const me = this;
	return me.content.charCodeAt(me.index + offset);
};

Lexer.prototype.nextLine = function() {
	const me = this;
	me.line = me.line + 1;
	return me.line;
};

Lexer.prototype.isStringEscaped = function() {
	return CHAR_CODES.QUOTE === this.codeAt(1);
}

Lexer.prototype.scanStringLiteral = function() {
	const me = this;
	let beginLine = me.line;
	let beginLineStart = me.lineStart;
	let stringStart = me.index + 1;
	let string = '';
	let code;

	while (true) {
		me.nextIndex();
		code = me.codeAt();
		if (CHAR_CODES.QUOTE === code) {
			if (me.isStringEscaped()) {
				me.nextIndex();
			} else {
				break;
			}
		}
		if (!me.isNotEOF()) {
			throw new Error('Unexpected string ending');
		}
	}

	me.nextIndex();
	string = me.content.slice(stringStart, me.index - 1).replace(/""/g, '"');

	return {
        type: TOKENS.StringLiteral,
        value: string,
        line: beginLine,
        lineStart: beginLineStart,
        lastLine: me.line,
        lastLineStart: me.lineStart,
        range: [me.tokenStart, me.index]
    };
};

Lexer.prototype.readDecLiteral = function() {
	const me = this;
	while (validator.isDecDigit(me.codeAt())) me.nextIndex();

	let foundFraction = false;
    if ('.' === me.codeAt()) {
      foundFraction = true;
      me.nextIndex()
      while (validator.isDecDigit(me.codeAt())) me.nextIndex();
    }

    return {
      value: parseFloat(me.content.slice(me.tokenStart, me.index)),
      hasFractionPart: foundFraction
    };
};

Lexer.prototype.scanNumericLiteral = function() {
	const me = this;
	const code = me.codeAt()
    const nextCode = me.codeAt(1);
    const literal = me.readDecLiteral()

    return {
		type: TOKENS.NumericLiteral,
		value: literal.value,
		line: me.line,
		lineStart: me.lineStart,
		range: [me.tokenStart, me.index]
    };
};

Lexer.prototype.scanPunctuator = function(value) {
	const me = this;

	me.index = me.index + value.length;

	return {
		type: TOKENS.Punctuator,
		value: value,
		line: me.line,
		lineStart: me.lineStart,
		range: [me.tokenStart, me.index]
    };
};

Lexer.prototype.skipWhiteSpace = function() {
	const me = this;

	while (me.isNotEOF()) {
		const code = me.codeAt();
		if (code === CHAR_CODES.WHITESPACE || code === CHAR_CODES.TAB) {
			me.nextIndex();
		} else {
			break;
		}
	} 
};

Lexer.prototype.scanIdentifierOrKeyword = function() {
	me = this;

	me.nextIndex();

	while (validator.isIdentifierPart(me.codeAt())) {
		me.nextIndex();
	}

	let value = me.content.slice(me.tokenStart, me.index);
	let type;

	if (validator.isKeyword(value)) {
		type = TOKENS.Keyword;

		if ('end' === value) {
			me.nextIndex();

			while (validator.isIdentifierPart(me.codeAt())) {
				me.nextIndex();
			}
			value = me.content.slice(me.tokenStart, me.index);
		} else if ('else' === value) {
			const elseIfStatement = me.content.slice(me.tokenStart, me.index + 3)
			if ('else if' === elseIfStatement) {
				me.nextIndex(3);
				value = elseIfStatement;
			}
		}
    } else if ('true' === value || 'false' === value) {
		type = TOKENS.BooleanLiteral;
		value = ('true' === value);
    } else if ('null' === value) {
		type = TOKENS.NilLiteral;
		value = null;
    } else {
      type = TOKENS.Identifier;
    }

    return {
		type: type,
		value: value,
		line: me.line,
		lineStart: me.lineStart,
		range: [me.tokenStart, me.index]
    };
};

Lexer.prototype.next = function() {
	const me = this;

	me.skipWhiteSpace();

	while (validator.isComment(me.codeAt(), me.codeAt(1))) {
		while (me.isNotEOF()) {
			if (validator.isEndOfLine(me.codeAt())) break;
			me.nextIndex();
		}
	}
	if (!me.isNotEOF()) {
		return {
			type : TOKENS.EOF,
			value: '<eof>',
			line: me.line,
			lineStart: me.lineStart,
			range: [me.index, me.index]
		};
	}

	const code = me.codeAt();
	const nextCode = me.codeAt(1);
	const lastCode = me.codeAt(2);

	me.tokenStart = me.index;

	if (validator.isEndOfLine(code)) {
		if (CHAR_CODES.NEW_LINE === code && CHAR_CODES.RETURN_LINE === nextCode) me.nextIndex();
		if (CHAR_CODES.RETURN_LINE === code && CHAR_CODES.NEW_LINE === nextCode) me.nextIndex();

		const token = {
			type : TOKENS.EOL,
			value: ';',
			line: me.line,
			lineStart: me.lineStart,
			range: [me.tokenStart, me.index]
		};

		me.nextLine();
		me.lineStart = me.nextIndex();

		return token;
	}

	if (validator.isIdentifierStart(code)) return me.scanIdentifierOrKeyword();

	scan = SCAN_MAP[code];

	if (scan) return scan.call(me, code, nextCode, lastCode);

	throw new Error('Invalid char ' + code + ':' + String.fromCharCode(code));
};

module.exports = Lexer;