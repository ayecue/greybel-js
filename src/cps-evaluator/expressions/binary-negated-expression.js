const typer = require('../typer');

const toPrimitive = (v) => {
	if (typer.isCustomValue(v)) {
		return v.valueOf();
	}

	return v;
};

const OPERATIONS = {
	'+': (a) => toPrimitive(a),
	'-': (a) => -toPrimitive(a)
};

const BinaryNegatedExpression = function(ast, visit, debug, raise) {
	const me = this;
	const buildExpression = function(node) {
		let expression;

		switch (node.type) {
			case 'BinaryNegatedExpression':
				expression = {
					type: node.type,
					operator: node.operator,
					arg: buildExpression(node.arg),
				};
				break;
			default:
				const op = visit(node);
				expression = op;
		}

		return expression;
	};

	me.ast = ast;
	me.expr = buildExpression(ast);
	me.isExpression = true;
	me.debug = debug;
	me.raise = raise;

	return me;
};

BinaryNegatedExpression.prototype.get = function(operationContext) {
	const me = this;
	const evaluate = async function(node) {
		switch(node.type) {
			case 'BinaryNegatedExpression':
				const arg = await evaluate(node.arg);

				return typer.cast(OPERATIONS[node.operator](arg));
			default: 
		}

		if (typer.isCustomValue(node)) {
			return node;
		}

		return node.get(operationContext);
	};

	me.debug('BinaryNegatedExpression', 'get', 'expr', me.expr);

	return evaluate(me.expr);
};

module.exports = BinaryNegatedExpression;