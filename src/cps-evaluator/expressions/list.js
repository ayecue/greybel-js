const CustomList = require('../types/custom-list');
const typer = require('../typer');

const ListExpression = function(ast, visit) {
	const me = this;
	const buildExpression = function(node) {
		let expression;

		switch (node.type) {
			case 'ListConstructorExpression':
				expression = node.fields.map((item) => {
					return buildExpression(item.value);
				});
				break;
			default:
				expression = visit(node);
		}

		return expression;
	};

	me.expr = buildExpression(ast);
	me.isExpression = true;

	return me;
};

ListExpression.prototype.get = function(operationContext, parentExpr) {
	const me = this;
	const evaluate = async function(node) {
		const traverselPath = [].concat(node);
		const list = [];

		while (current = traverselPath.shift()) {
			if (typer.isCustomValue(current)) {
				list.push(current);
			} else if (current?.isExpression) {
				list.push(await current.get(operationContext));
			} else {
				console.error(current);
				throw new Error('Unexpected handle');
			}
		}

		return new CustomList(list);
	};

	return evaluate(me.expr);
};

module.exports = ListExpression;