const IfOperation = function(ast) {
	const me = this;
	me.ast = ast;
	me.condition = null;
	me.body = null;
	me.isOperation = true;
	return me;
};

module.exports = IfOperation;