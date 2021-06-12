const typer = require('../typer');

const OPERATIONS = {
	'+': (a, b) => {
		if (typer.isCustomList(a) || typer.isCustomList(b)) {
			return a.concat(b);
		}

		return a + b;
	},
	'-': (a, b) => a - b,
	'/': (a, b) => a / b,
	'*': (a, b) => a * b,
	'^': (a, b) => a ^ b,
	'|': (a, b) => a | b,
	'<': (a, b) => a < b,
	'>': (a, b) => a > b,
	'<<': (a, b) => a << b,
	'>>': (a, b) => a >> b,
	'>>>': (a, b) => a >>> b,
	'&': (a, b) => a & b,
	'%': (a, b) => a % b,
	'>=': (a, b) => a >= b,
	'==': (a, b) => a == b,
	'<=': (a, b) => a <= b,
	'!=': (a, b) => a != b,
	'and': (a, b) => a && b,
	'or': (a, b) => a || b
};

const LogicalAndBinaryExpression = function(ast, visit) {
	const me = this;
	const buildExpression = function(node) {
		let expression;

		switch (node.type) {
			case 'LogicalExpression':
			case 'BinaryExpression':
				expression = {
					type: node.type,
					operator: node.operator,
					left: buildExpression(node.left),
					right: buildExpression(node.right)
				};
				break;
			default:
				const op = visit(node);
				expression = op;
		}

		return expression;
	};

	me.expr = buildExpression(ast);
	me.isExpression = true;

	return me;
};

LogicalAndBinaryExpression.prototype.get = function(operationContext) {
	const me = this;
	const evaluate = async function(node) {
		let left;
		let right;

		switch(node.type) {
			case 'BinaryExpression':
				left = await evaluate(node.left);
				right = await evaluate(node.right);

				return OPERATIONS[node.operator](left, right);
			case 'LogicalExpression':
				left = await evaluate(node.left);

				if (node.operator === 'and' && !left) {
					return false;
				}

				right = await evaluate(node.right);
				
				return !!OPERATIONS[node.operator](left, right);
			default: 
		}

		if (typer.isCustomValue(node)) {
			return node;
		}

		return node.get(operationContext);
	};

	console.log('LogicalAndBinaryExpression', 'get', 'expr', me.expr);

	return evaluate(me.expr);
};

module.exports = LogicalAndBinaryExpression;