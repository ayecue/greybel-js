const BodyOperation = function(ast, debug, raise) {
	const me = this;
	me.ast = ast;
	me.stack = [];
	me.isOperation = true;
	me.debug = debug;
	me.raise = raise;
	return me;
};

BodyOperation.prototype.run = async function(operationContext) {
	const me = this;
	let isEOL = () => false;

	if (operationContext.type === 'LOOP') {
		const context = operationContext.getMemory('loopContext');

		isEOL = () => context.isBreak || context.isContinue;
	} else if (operationContext.type === 'FUNCTION') {
		const context = operationContext.getMemory('functionContext');

		isEOL = () => context.isReturn;
	}

	for (let entity of me.stack) {
		if (entity?.isExpression) {
			await entity.get(operationContext);
		} else {
			await entity.run(operationContext);
		}
		if (isEOL()) break;
	}
};

module.exports = BodyOperation;