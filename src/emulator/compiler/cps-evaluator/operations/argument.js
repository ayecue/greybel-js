const typer = require('../typer');

const ArgumentOperation = function(ast) {
	const me = this;
	me.ast = ast;
	me.stack = [];
	me.isOperation = true;
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
			args.push(await entity.get(operationContext));
		} else {
			throw new Error('Unexpected argument');
		}
	}

	return args;
};

module.exports = ArgumentOperation;