const EnvarOperation = function(ast) {
	const me = this;
	me.ast = ast;
	me.name = null;
	me.isOperation = true;
	return me;
};

module.exports = EnvarOperation;