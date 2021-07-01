const typer = require('../typer');

const CallExpression = function(ast, visit, debug, raise) {
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

	me.ast = ast;
	me.expr = buildExpression(ast);
	me.isExpression = true;
	me.debug = debug;
	me.raise = raise;

	return me;
};

CallExpression.prototype.get = function(operationContext, parentExpr) {
	const me = this;
	const opc = operationContext.fork('CALL', 'TEMPORARY');
	const resolveArgs = function(...args) {
		return Promise.all(args.map(async (item) => {
			if (typer.isCustomValue(item)) {
				return item;
			}
			return item.get(opc);
		}));
	};
	const evaluate = async function(node) {
		if (node?.isExpression) {
			return node.get(opc);
		}

		const args = await resolveArgs(...node.args);

		if (node.path?.type === 'call') {
			const callResult = await evaluate(node.path);

			if (callResult?.isOperation) {
				opc.setMemory('args', args);
				return callResult.run(opc);
			} else {
				me.raise('Unexpected handle result', me, callResult);
			}
		}

		const pathExpr = await node.path.get(opc, me.expr);

		if (pathExpr.handle) {
			if (typer.isCustomMap(pathExpr.handle)) {
				const callable = await pathExpr.handle.getCallable(pathExpr.path);

				if (callable.origin?.isOperation) {
					opc.setMemory('args', args);
					return callable.origin.run(opc);
				} else if (callable.origin instanceof Function) {
					return callable.origin.call(pathExpr.handle, ...args);
				}

				me.raise('Unexpected handle call', me, callable);
			}

			return typer.cast(pathExpr.handle.callMethod(pathExpr.path, ...args));
		}
		
		const callable = await opc.getCallable(pathExpr.path);

		opc.setMemory('args', args);

		if (callable.origin?.isOperation) {
			return callable.origin.run(opc);
		} else if (callable.origin instanceof Function) {
			return typer.cast(await callable.origin.call(callable.context, ...args));
		}

		return typer.cast(callable.origin);
	};

	me.debug('CallExpression', 'get', 'expr', me.expr);

	return evaluate(me.expr);
};

module.exports = CallExpression;