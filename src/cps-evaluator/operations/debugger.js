const DebuggerOperation = function(ast, debug, raise) {
	const me = this;
	me.ast = ast;
	me.isOperation = true;
	me.debug = debug;
	me.raise = raise;
	return me;
};

DebuggerOperation.prototype.run = async function(operationContext) {
	const debuggerFn = await operationContext.get('__debugger');
	
	await debuggerFn(operationContext);
};

module.exports = DebuggerOperation;