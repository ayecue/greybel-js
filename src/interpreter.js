const cpsEvaluator = require('./cps-evaluator');
const OperationContext = require('./interpreter/operation-context');
const CodeParser = require('./parser');
const typer = require('./cps-evaluator/typer')

const Interpreter = function(code, params, api) {
	const me = this;
	me.code = code;
	me.api = api;
	me.params = params;
	return me;
};

Interpreter.prototype.digest = function() {
	const me = this;

	const parser = new CodeParser(me.code);
	const chunk = parser.parseChunk();
	const cps = cpsEvaluator(chunk);
	const mainContext = new OperationContext(true);
	
	mainContext.extend({
		...me.api,
		params: typer.cast(me.params)
	});

	console.log({
		...me.api,
		params: typer.cast(me.params)
	});

	return cps.run(mainContext)
		.catch((err) => {
			console.error(err);
			throw err;
		});
};

module.exports = function(code, params, api) {
	return (new Interpreter(code, params, api)).digest();
};