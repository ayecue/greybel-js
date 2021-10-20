const typer = require('../typer');

const ReferenceOperation = function(ast, debug, raise) {
	const me = this;
	me.ast = ast;
	me.arg = null;
	me.isOperation = true;
	me.debug = debug;
	me.raise = raise;
	return me;
};

ReferenceOperation.prototype.get = async function(operationContext) {
	const me = this;
	let arg;

	if (typer.isCustomValue(me.arg)) {
		return me.arg;
	} else if (me.arg?.isExpression) {
		arg = await me.arg.get(operationContext, me);
	} else {
		me.raise('Unexpected reference', me, me.arg);
	}

	if (typer.isCustomValue(arg)) {
		return arg;
	} else if (arg.handle) {
		if (arg.handle?.isObject) {
			return arg.handle.get(arg.path);
		}

		me.raise('Unexpected handle in reference statement', me, arg.handle);
	}

	return operationContext.get(arg.path);
};

module.exports = ReferenceOperation;