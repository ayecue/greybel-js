const uuidv4 = require('uuid').v4;

const FunctionOperation = function(ast) {
	const me = this;
	me.ast = ast;
	me.id = uuidv4();
	me.args = null;
	me.body = null;
	me.isOperation = true;
	return me;
};

FunctionOperation.prototype.get = function(operationContext) {
	return this;
};

FunctionOperation.prototype.run = async function(operationContext) {
	const me = this;
	const opc = operationContext.fork('FUNCTION', 'CALL');
	const incArgs = operationContext.getMemory('args');
	const args = await me.args.get(opc);
	const argMap = {};
	const functionContext = {
		value: null,
		isReturn: false
	};

	opc.setMemory('functionContext', functionContext);

	for (let arg of args) {
		opc.set(arg.path[0], incArgs.pop());
	}

	await me.body.run(opc);

	return functionContext.value;
};

module.exports = FunctionOperation;