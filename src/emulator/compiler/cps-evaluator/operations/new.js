const NewOperation = function(ast) {
	const me = this;
	me.ast = ast;
	me.arg = null;
	me.isOperation = true;
	return me;
};

NewOperation.prototype.get = function(operationContext) {
	const me = this;
	
};

module.exports = NewOperation;