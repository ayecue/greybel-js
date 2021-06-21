const typer = require('../typer');

const toPrimitive = (v) => {
	if (typer.isCustomValue(v)) {
		return v.valueOf();
	}

	return v;
};

const multiplyString = (a, b) => {
	a = a.valueOf() || '';
	b = b.valueof();

	return new Array(b)
		.fill(a)
		.join('');
};

const OPERATIONS = {
	'+': (a, b) => {
		if (typer.isCustomList(a) || typer.isCustomList(b)) {
			return a.concat(b);
		}

		if (typer.isCustomString(a)) {
			a = a.valueOf() || '';
		} else {
			a = toPrimitive(a);
		}

		if (typer.isCustomString(b)) {
			b = b.valueOf() || '';
		} else {
			b = toPrimitive(b);
		}

		return a + b;
	},
	'-': (a, b) => toPrimitive(a) - toPrimitive(b),
	'/': (a, b) => toPrimitive(a) / toPrimitive(b),
	'*': (a, b) => {
		if (typer.isCustomString(a) && typer.isCustomNumber(b)) {
			return multiplyString(a, b);
		} else if (typer.isCustomString(b) && typer.isCustomNumber(a)) {
			return multiplyString(b, a);
		}

		a = toPrimitive(a);
		b = toPrimitive(b);

		return a * b;
	},
	'^': (a, b) => toPrimitive(a) ^ toPrimitive(b),
	'|': (a, b) => toPrimitive(a) | toPrimitive(b),
	'<': (a, b) => toPrimitive(a) < toPrimitive(b),
	'>': (a, b) => toPrimitive(a) > toPrimitive(b),
	'<<': (a, b) => toPrimitive(a) << toPrimitive(b),
	'>>': (a, b) => toPrimitive(a) >> toPrimitive(b),
	'>>>': (a, b) => toPrimitive(a) >>> toPrimitive(b),
	'&': (a, b) => toPrimitive(a) & toPrimitive(b),
	'%': (a, b) => toPrimitive(a) % toPrimitive(b),
	'>=': (a, b) => toPrimitive(a) >= toPrimitive(b),
	'==': (a, b) => toPrimitive(a) == toPrimitive(b),
	'<=': (a, b) => toPrimitive(a) <= toPrimitive(b),
	'!=': (a, b) => toPrimitive(a) != toPrimitive(b),
	'and': (a, b) => toPrimitive(a) && toPrimitive(b),
	'or': (a, b) => toPrimitive(a) || toPrimitive(b)
};

const LogicalAndBinaryExpression = function(ast, visit, debug, raise) {
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
	me.debug = debug;
	me.raise = raise;

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

				return typer.cast(OPERATIONS[node.operator](left, right));
			case 'LogicalExpression':
				left = await evaluate(node.left);

				if (typer.isCustomList(left) && !left.valueOf()) {
					left = false;
				}

				if (node.operator === 'and' && !toPrimitive(left)) {
					return false;
				} else if (node.operator === 'or' && toPrimitive(left)) {
					return true;
				}

				right = await evaluate(node.right);
				
				return OPERATIONS[node.operator](left, right);
			default: 
		}

		if (typer.isCustomValue(node)) {
			return node;
		}

		return node.get(operationContext);
	};

	me.debug('LogicalAndBinaryExpression', 'get', 'expr', me.expr);

	return evaluate(me.expr);
};

module.exports = LogicalAndBinaryExpression;