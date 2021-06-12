const ContinueOperation = function(ast) {
	const me = this;
	me.ast = ast;
	me.isOperation = true;
	return me;
};

ContinueOperation.prototype.run = async function(operationContext) {
	const me = this;
	const loopContext = operationContext.getMemory('loopContext');

	loopContext.isContinue = true;
};

module.exports = ContinueOperation;