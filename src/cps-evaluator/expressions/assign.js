const typer = require('../typer');

const AssignExpression = function(ast, visit, debug, raise) {
	const me = this;
	const buildExpression = function(node) {
		let expression;
		let base;

		switch (node.type) {
			case 'AssignmentStatement':
				expression = {
					left: buildExpression(node.variable),
					right: buildExpression(node.init)
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

AssignExpression.prototype.get = async function(operationContext, parentExpr) {
	const me = this;
	const evaluate = async function(node) {
		if (!node.left?.isExpression) {
			me.raise('Unexpected left assignment', me, left);
		}

		const left = await node.left.get(operationContext, me.expr);

		let right = node.right;

		if (typer.isCustomValue(right)) {
			right = right;
		} else if (node.right?.isExpression) {
			right = await right.get(operationContext);
		} else if (node.right?.isOperation) {
			right = await right.get(operationContext);

			const pathLength = left.path.length;

			if (right?.isFunction && pathLength > 1) {
				const origin = await operationContext.get(left.path.slice(0, pathLength - 1));

				if (typer.isCustomMap(origin)) {
					right = right.fork(origin);
				}
			}
		} else {
			me.raise('Unexpected right assignment', me, right);
		}

		if (left.handle) {
			if (typer.isCustomMap(left.handle)) {
				const handlePath = left.path;
				const context = left.handle;
				
				await context.set(handlePath, right);

		 		return true;
			} else {
				me.raise('Unexpected left assignment', me, left);
			}
		}

		await operationContext.set(left.path, right);

		return true;
	};

	me.debug('AssignExpression', 'get', 'expr', me.expr);

	return await evaluate(me.expr);
};

module.exports = AssignExpression;