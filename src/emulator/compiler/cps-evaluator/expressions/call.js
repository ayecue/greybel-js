const typer = require('../typer');

const CallExpression = function(ast, visit) {
	const me = this;
	const buildExpression = function(node) {
		let expression;
		let base;

		switch (node.type) {
			case 'CallStatement':
				expression = buildExpression(node.expression);
				break;
			case 'CallExpression':
				expression = {
					type: 'call',
					path: buildExpression(node.base),
					args: node.arguments.map((arg) => {
						return visit(arg);
					})
				};
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

CallExpression.prototype.get = function(operationContext, parentExpr) {
	const me = this;
	const resolveArgs = function(...args) {
		return Promise.all(args.map(async (i) => {
			if (typer.isCustomValue(i)) {
				return i.value;
			}
			return i.get(operationContext);
		}));
	};
	const evaluate = async function(node) {
		if (node?.isExpression) {
			return node.get(operationContext);
		}

		if (node.path?.type === 'call') {
			const callResult = await evaluate(node.path);

			if (callResult?.isOperation) {
				return callResult.run(operationContext);
			} else {
				throw new Error('Unexpected call result');
			}
		}

		const pathExpr = await node.path.get(operationContext, me.expr);
		const args = await resolveArgs(...node.args);

		if (pathExpr.handle) {
			return typer.cast(pathExpr.handle.callMethod(pathExpr.path.join('.'), ...args));
		}
		
		const callable = await operationContext.getCallable(pathExpr.path);

		if (callable.origin?.isOperation) {
			return callable.origin.run(operationContext);
		}

		return callable.origin.call(callable.context, ...args);
	};

	console.log('CallExpression', 'get', 'expr', me.expr);

	return evaluate(me.expr);
};

module.exports = CallExpression;