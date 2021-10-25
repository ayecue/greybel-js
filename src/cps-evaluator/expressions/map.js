const CustomMap = require('../types/custom-map');
const typer = require('../typer');

const MapExpression = function(ast, visit, debug, raise) {
	const me = this;
	const buildExpression = function(node) {
		let expression;

		switch (node.type) {
			case 'MapConstructorExpression':
				expression = {
					type: 'map',
					values: node.fields.map((item) => {
						return {
							key: visit(item.key),
							value: visit(item.value)
						};
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

MapExpression.prototype.get = function(operationContext, parentExpr) {
	const me = this;
	const evaluate = async function(node) {
		const traverselPath = [].concat(node);
		const map = {};
		let current;

		while (current = traverselPath.shift()) {
			let key;
			let value;

			if (typer.isCustomValue(current.key)) {
				key = current.key.valueOf();
			} else {
				me.raise('Unexpected key', me, current.key);
			}

			if (typer.isCustomValue(current.value)) {
				value = current.value;
			} else if (current.value?.isExpression) {
				value = await current.value.get(operationContext);
			} else {
				me.raise('Unexpected value', me, current.value);
			}

			map[key] = value;
		}

		return new CustomMap(map);
	};

	me.debug('MapExpression', 'get', 'expr', me.expr);

	return evaluate(me.expr.values);
};

module.exports = MapExpression;