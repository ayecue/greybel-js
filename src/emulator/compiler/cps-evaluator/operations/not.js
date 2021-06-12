const NotOperation = function(ast) {
	const me = this;
	me.ast = ast;
	me.arg = null;
	me.isOperation = true;
	return me;
};

NotOperation.prototype.get = function(operationContext) {
	return !this.arg.get(operationContext);
};

module.exports = NotOperation;