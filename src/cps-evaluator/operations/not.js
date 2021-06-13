const typer = require('../typer');
const logger = require('node-color-log');

const NotOperation = function(ast) {
	const me = this;
	me.ast = ast;
	me.arg = null;
	me.isOperation = true;
	return me;
};

NotOperation.prototype.get = async function(operationContext) {
	const me = this;
	let arg;

	if (typer.isCustomValue(me.arg)) {
		arg = me.arg.valueOf();
	} else if (me.arg?.isExpression) {
		arg = await me.arg.get(operationContext);

		if (typer.isCustomValue(arg)) {
			arg = arg.valueOf();
		}
	} else {
		logger.error(me.arg);
		throw new Error('Unexpected not operation');
	}

	return !arg;
};

module.exports = NotOperation;