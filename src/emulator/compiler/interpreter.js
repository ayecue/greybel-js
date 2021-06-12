const cpsEvaluator = require('./cps-evaluator');
const OperationContext = require('./interpreter/operation-context');
const CodeParser = require('../../parser');
const logger = require('node-color-log');
const build = require('../../build');

const Interpreter = function(code) {
	const me = this;
	me.code = code;
	return me;
};

Interpreter.prototype.digest = function() {
	const me = this;

	const parser = new CodeParser(me.code);
	const chunk = parser.parseChunk();
	const cps = cpsEvaluator(chunk);
	const mainContext = new OperationContext(true);
	
	mainContext.extend({
		print: console.log.bind(null, '>>> print'),
		char: (code) => String.fromCharCode(code)
	});

	return cps.run(mainContext)
		.catch((err) => {
			console.error(err);
			process.exit(1);
		});
};

const start /*module.exports*/ = function(code) {
	return (new Interpreter(code)).digest();
};

const path = require('path');

start(build(path.resolve(__dirname, '../../../test.src'), null, {
	noWrite: true
}));