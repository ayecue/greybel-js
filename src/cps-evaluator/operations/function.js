const uuidv4 = require('uuid').v4;

const FunctionOperation = function(ast, debug, raise) {
	const me = this;
	me.ast = ast;
	me.id = uuidv4();
	me.args = null;
	me.body = null;
	me.isOperation = true;
	me.context = null;
	me.isFunction = true;
	me.debug = debug;
	me.raise = raise;
	return me;
};

FunctionOperation.prototype.getType = function() {
	return 'function';
};

FunctionOperation.prototype.fork = function(context) {
	const me = this;
	const newFunction = new FunctionOperation(me.ast);

	newFunction.args = me.args;
	newFunction.body = me.body;
	newFunction.context = context;

	return newFunction;
};

FunctionOperation.prototype.get = function(operationContext) {
	return this;
};

FunctionOperation.prototype.toString = function() {
	return 'Function';
};

FunctionOperation.prototype.run = async function(operationContext) {
	const me = this;
	const opc = operationContext.fork('FUNCTION', 'DEFAULT');
	const incArgs = operationContext.getMemory('args');
	const args = await me.args.get(opc);
	const argMap = {};
	const functionContext = {
		value: null,
		isReturn: false,
		context: me.context
	};

	opc.setMemory('functionContext', functionContext);

	let index = 0;
	const max = args.length;

	while (index < max) {
		await opc.set(args[index].path[0], incArgs[index]);
		index++;
	}

	await me.body.run(opc);

	return functionContext.value;
};

module.exports = FunctionOperation;