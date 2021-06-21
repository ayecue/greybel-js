const ElseIfOperation = function(ast, debug, raise) {
	const me = this;
	me.ast = ast;
	me.condition = null;
	me.body =null;
	me.isOperation = true;
	me.debug = debug;
	me.raise = raise;
	return me;
};

module.exports = ElseIfOperation;