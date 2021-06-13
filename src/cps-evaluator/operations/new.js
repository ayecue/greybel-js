const typer = require('../typer');
const logger = require('node-color-log');

const NewOperation = function(ast) {
	const me = this;
	me.ast = ast;
	me.arg = null;
	me.isOperation = true;
	return me;
};

NewOperation.prototype.get = async function(operationContext) {
	const me = this;
	let arg;

	if (typer.isCustomValue(me.arg)) {
		arg = me.arg;
	} else if (me.arg?.isExpression) {
		arg = await me.arg.get(operationContext);
	} else {
		logger.error(me.arg);
		throw new Error('Unexpected reference');
	}

	if (!typer.isCustomMap(arg)) {
		logger.error(arg);
		throw new Error('Unexpected type for new operator');
	}

	return arg.createInstance();
};

module.exports = NewOperation;