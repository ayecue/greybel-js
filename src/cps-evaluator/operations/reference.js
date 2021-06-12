const typer = require('../typer');

const ReferenceOperation = function(ast) {
	const me = this;
	me.ast = ast;
	me.arg = null;
	me.isOperation = true;
	return me;
};

ReferenceOperation.prototype.get = async function(operationContext) {
	const me = this;
	let arg;

	if (me.arg?.isExpression) {
		arg = await me.arg.get(operationContext, me);
	} else {
		console.error(me.arg);
		throw new Error('Unexpected reference');
	}

	if (arg.handle) {
		if (typer.isCustomMap(arg.handle)) {
			return arg.handle.get(arg.path);
		}

		console.error(arg.handle, me.ast);
		throw new Error('Unexpected handle in reference statement');
	}

	return operationContext.get(arg.path);
};

module.exports = ReferenceOperation;