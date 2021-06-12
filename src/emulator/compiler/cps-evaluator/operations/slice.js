const SliceOperation = function(ast) {
	const me = this;
	me.ast = ast;
	me.left = null;
	me.right = null;
	me.isOperation = true;
	return me;
};

module.exports = SliceOperation;