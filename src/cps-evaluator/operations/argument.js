const typer = require('../typer');

const ArgumentOperation = function(ast, debug, raise) {
	const me = this;
	me.ast = ast;
	me.stack = [];
	me.isOperation = true;
	me.debug = debug;
	me.raise = raise;
	return me;
};

ArgumentOperation.prototype.get = async function(operationContext) {
	const me = this;
	const stack = me.stack;
	const args = [];

	for (let entity of stack) {
		if (typer.isCustomValue(entity)) {
			args.push(entity);
		} else if (entity?.isExpression) {
			args.push(await entity.get(operationContext, me));
		} else {
			me.raise('Unexpected argument', me, entity);
		}
	}

	return args;
};

module.exports = ArgumentOperation;