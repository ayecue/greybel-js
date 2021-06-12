const BreakOperation = function(ast) {
	const me = this;
	me.ast = ast;
	me.isOperation = true;
	return me;
};

BreakOperation.prototype.run = async function(operationContext) {
	const me = this;
	const loopContext = operationContext.getMemory('loopContext');

	loopContext.isBreak = true;
};

module.exports = BreakOperation;