const CustomMap = require('../types/custom-map');
const logger = require('node-color-log');

const MapExpression = function(ast, visit) {
	const me = this;
	const buildExpression = function(node) {
		let expression;

		switch (node.type) {
			case 'MapConstructorExpression':
				expression = node.fields.map((item) => {
					return {
						key: buildExpression(item.key),
						value: buildExpression(item.value)
					};
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

MapExpression.prototype.get = function(operationContext, parentExpr) {
	const me = this;
	const evaluate = async function(node) {
		const traverselPath = [].concat(node);
		const map = {};

		while (current = traverselPath.shift()) {
			let key;
			let value;

			if (typer.isCustomValue(current.key)) {
				key = current.key.valueOf();
			} else {
				logger.error(current.key);
				throw new Error('Unexpected key');
			}

			if (typer.isCustomValue(current.value)) {
				value = current;
			} else if (current.value?.isExpression) {
				value = await current.value.get(operationContext);
			} else {
				logger.error(current.value);
				throw new Error('Unexpected value');
			}

			map[key] = value;
		}

		return new CustomMap(map);
	};

	return evaluate(me.expr);
};

module.exports = MapExpression;