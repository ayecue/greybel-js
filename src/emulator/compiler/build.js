const builder = require('./build/builder');
const Parser = require('./parser');
const logger = require('node-color-log');

const BuilderJS = function(code) {
	const me = this;
	me.code = code;
	return me;
};

BuilderJS.prototype.compile = function() {
	const me = this;

	const parser = new Parser(me.code);
	const chunk = parser.parseChunk();
	const code = builder(chunk);

	return code;
};

module.exports = function(code) {
	return (new BuilderJS(code)).compile();
};