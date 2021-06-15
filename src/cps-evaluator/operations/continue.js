const ContinueOperation = function(ast, debug, raise) {
	const me = this;
	me.ast = ast;
	me.isOperation = true;
	me.debug = debug;
	me.raise = raise;
	return me;
};

ContinueOperation.prototype.run = async function(operationContext) {
	const me = this;
	const loopContext = operationContext.getMemory('loopContext');

	loopContext.isContinue = true;
};

module.exports = ContinueOperation;