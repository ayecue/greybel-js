const BodyOperation = require('./body');
const typer = require('../typer');

const ForOperation = function(ast, debug, raise) {
	const me = this;
	me.ast = ast;
	me.variable = null;
	me.iterator = null;
	me.body = null;
	me.isOperation = true;
	me.debug = debug;
	me.raise = raise;
	return me;
};

ForOperation.prototype.run = async function(operationContext) {
	const me = this;
	const opc = operationContext.fork('LOOP', 'TEMPORARY');
	const variable = await me.variable.get(opc, me);
	const iterator = await me.iterator.get(opc);
	const loopContext = {
		isBreak: false,
		isContinue: false
	};

	opc.setMemory('loopContext', loopContext);

	for (let value of iterator) {
		loopContext.isContinue = false;
		await opc.set(variable.path, typer.cast(value));
		await me.body.run(opc);
		if (loopContext.isContinue) continue;
		if (loopContext.isBreak) break;
	}
};

module.exports = ForOperation;