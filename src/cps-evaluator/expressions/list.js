const CustomList = require('../types/custom-list');
const typer = require('../typer');

const ListExpression = function(ast, visit, debug, raise) {
	const me = this;
	const buildExpression = function(node) {
		let expression;

		switch (node.type) {
			case 'ListConstructorExpression':
				expression = {
					type: 'list',
					values: node.fields.map((item) => {
						return visit(item.value);
					})
				};
				break;
			default:
				expression = visit(node);
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

ListExpression.prototype.get = function(operationContext, parentExpr) {
	const me = this;
	const evaluate = async function(node) {
		const traverselPath = [].concat(node);
		const list = [];
		let current;

		while (current = traverselPath.shift()) {
			if (typer.isCustomValue(current)) {
				list.push(current);
			} else if (current?.isExpression) {
				list.push(await current.get(operationContext));
			} else {
				me.raise('Unexpected handle', me, current);
			}
		}

		return new CustomList(list);
	};

	me.debug('ListExpression', 'get', 'expr', me.expr);

	return evaluate(me.expr.values);
};

module.exports = ListExpression;