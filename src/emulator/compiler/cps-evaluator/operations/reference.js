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
		throw new Error('Unexpected handle in reference statement');
	}

	return operationContext.get(arg.path);
};

module.exports = ReferenceOperation;