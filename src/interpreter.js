const cpsEvaluator = require('./cps-evaluator');
const OperationContext = require('./interpreter/operation-context');
const CodeParser = require('./parser');
const typer = require('./cps-evaluator/typer');
const EventEmitter = require('events');

const Interpreter = function(options) {
	const me = this;

	me.code = options.code;
	me.api = options.api;
	me.params = options.params;
	me.emitter = options.eventEmitter || new EventEmitter();

	return me;
};

Interpreter.prototype.raise = function(message, item, ...args) {
	const me = this;
	me.emitter.emit('error', message, item, ...args);
	throw new Error(message);
};

Interpreter.prototype.debug = function(message, ...args) {
	const me = this;
	me.emitter.emit('debug', message, ...args);
};

Interpreter.prototype.digest = function() {
	const me = this;

	const parser = new CodeParser(me.code);
	const chunk = parser.parseChunk();
	const cps = cpsEvaluator({
		chunk: chunk,
		debug: me.debug.bind(me),
		raise: me.raise.bind(me)
	});
	const mainContext = new OperationContext(true);
	
	mainContext.extend({
		...me.api,
		params: typer.cast(me.params)
	});

	return cps.run(mainContext)
		.catch((err) => {
			console.error(err);
			throw err;
		});
};

module.exports = function(options) {
	return (new Interpreter(options)).digest();
};