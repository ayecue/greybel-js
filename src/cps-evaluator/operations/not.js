const typer = require('../typer');

const NotOperation = function(ast, debug, raise) {
	const me = this;
	me.ast = ast;
	me.arg = null;
	me.isOperation = true;
	me.debug = debug;
	me.raise = raise;
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
		me.raise('Unexpected not operation', me, me.arg);
	}

	return !arg;
};

module.exports = NotOperation;