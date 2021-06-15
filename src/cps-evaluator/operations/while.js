const typer = require('../typer');

const WhileOperation = function(ast, debug, raise) {
	const me = this;
	me.ast = ast;
	me.condition = null;
	me.body = null;
	me.isOperation = true;
	me.debug = debug;
	me.raise = raise;
	return me;
};

WhileOperation.prototype.run = async function(operationContext) {
	const me = this;
	const opc = operationContext.fork('LOOP', 'TEMPORARY');
	const loopContext = {
		isBreak: false,
		isContinue: false
	};
	const resolveCondition = function() {
		if (typer.isCustomValue(me.condition)) {
			return me.condition.valueOf();
		}
		return me.condition.get(opc);
	};

	opc.setMemory('loopContext', loopContext);

	while (await resolveCondition()) {
		loopContext.isContinue = false;
		await me.body.run(opc);
		if (loopContext.isContinue) continue;
		if (loopContext.isBreak) break;
	}
};

module.exports = WhileOperation;