const ImportOperation = function(ast) {
	const me = this;
	me.ast = ast;
	me.name = null;
	me.body = null;
	me.isOperation = true;
	return me;
};

module.exports = ImportOperation;