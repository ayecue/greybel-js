const ElseOperation = function(ast, debug, raise) {
	const me = this;
	me.ast = ast;
	me.body = null;
	me.isOperation = true;
	me.debug = debug;
	me.raise = raise;
	return me;
};

module.exports = ElseOperation;