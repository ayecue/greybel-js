const typer = require('../typer');

const ReturnOperation = function(ast, debug, raise) {
	const me = this;
	me.ast = ast;
	me.arg = null;
	me.isOperation = true;
	me.debug = debug;
	me.raise = raise;
	return me;
};

ReturnOperation.prototype.run = async function(operationContext) {
	const me = this;
	const functionContext = operationContext.getMemory('functionContext');
	let arg;

	if (typer.isCustomValue(me.arg)) {
		arg = me.arg
	} else if (me.arg?.isExpression) {
		arg = await me.arg.get(operationContext);
	} else if (me.arg?.isOperation) {
		arg = await me.arg.get(operationContext);
	} else {
		me.raise('Unexpected return value', me, me.arg);
	}

	functionContext.value = arg;
	functionContext.isReturn = true;
};

module.exports = ReturnOperation;