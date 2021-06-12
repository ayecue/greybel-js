const IncludeOperation = function(ast) {
	const me = this;
	me.ast = ast;
	me.body = null;
	me.isOperation = true;
	return me;
};

module.exports = IncludeOperation;