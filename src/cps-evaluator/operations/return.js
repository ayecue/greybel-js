const typer = require('../typer');
const logger = require('node-color-log');

const ReturnOperation = function(ast) {
	const me = this;
	me.ast = ast;
	me.arg = null;
	me.isOperation = true;
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
		logger.error(me.arg);
		throw new Error('Unexpected return value');
	}

	functionContext.value = arg;
	functionContext.isReturn = true;
};

module.exports = ReturnOperation;