const WhileOperation = function(ast) {
	const me = this;
	me.ast = ast;
	me.condition = null;
	me.body = null;
	me.isOperation = true;
	return me;
};

WhileOperation.prototype.run = async function(operationContext) {
	const me = this;
	const opc = operationContext.fork('LOOP', 'TEMPORARY');
	const loopContext = {
		isBreak: false,
		isContinue: false
	};

	opc.setMemory('loopContext', loopContext);

	while (await me.condition.get(opc)) {
		loopContext.isContinue = false;
		await me.body.run(opc);
		if (loopContext.isContinue) continue;
		if (loopContext.isBreak) break;
	}
};

module.exports = WhileOperation;