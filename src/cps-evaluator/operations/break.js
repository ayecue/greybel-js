const BreakOperation = function(ast, debug, raise) {
	const me = this;
	me.ast = ast;
	me.isOperation = true;
	me.debug = debug;
	me.raise = raise;
	return me;
};

BreakOperation.prototype.run = async function(operationContext) {
	const me = this;
	const loopContext = operationContext.getMemory('loopContext');

	loopContext.isBreak = true;
};

module.exports = BreakOperation;