const TopOperation = function() {
	const me = this;
	me.body = null;
	me.isOperation = true;
	return me;
};

TopOperation.prototype.run = async function(operationContext) {
	const me = this;
	const opc = operationContext.fork('GLOBAL', 'DEFAULT');
	opc.extend({
		globals: opc.scope
	});
	await me.body.run(opc);
};

module.exports = TopOperation;