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

	if (me.arg?.isExpression) {
		arg = await me.arg.get(operationContext, me);
	} else {
		me.raise('Unexpected reference', me, me.arg);
	}

	if (arg.handle) {
		if (typer.isCustomMap(arg.handle)) {
			return arg.handle.get(arg.path);
		}

		me.raise('Unexpected handle in reference statement', me, arg.handle);
	}

	return operationContext.get(arg.path);
};

module.exports = ReferenceOperation;