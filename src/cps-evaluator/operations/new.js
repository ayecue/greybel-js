const typer = require('../typer');

const NewOperation = function(ast, debug, raise) {
	const me = this;
	me.ast = ast;
	me.arg = null;
	me.isOperation = true;
	me.debug = debug;
	me.raise = raise;
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
		me.raise('Unexpected reference', me, me.arg);
	}

	if (!typer.isCustomMap(arg)) {
		me.raise('Unexpected type for new operator', me, arg);
	}

	return arg.createInstance();
};

module.exports = NewOperation;