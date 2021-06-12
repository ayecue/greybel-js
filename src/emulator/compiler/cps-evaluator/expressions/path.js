const typer = require('../typer');

const PathExpression = function(ast, visit) {
	const me = this;
	const append = function(expr, v) {
		if (Array.isArray(v)) {
			return expr.concat(v);
		}
		
		return expr.concat([v]);
	};
	const buildExpression = function(node) {
		let expression = [];

		switch (node.type) {
			case 'MemberExpression':
				expression = append(expression, buildExpression(node.base));
				expression = append(expression, buildExpression(node.identifier));

				break;
			case 'IndexExpression':
				expression = append(expression, buildExpression(node.base));
				expression = append(expression, buildExpression(node.index));

				break;
			case 'Identifier':
				expression = append(expression, {
					type: 'path',
					value: node.name
				});
				break;
			default:
				expression = append(expression, visit(node));
		}

		return expression;
	};

	me.expr = buildExpression(ast);
	me.isExpression = true;

	return me;
};

PathExpression.prototype.isCustomValueCall = function() {
	return typer.isCustomValue(this.expr[0]);
};

PathExpression.prototype.getByIndex = function(index) {
	return this.expr[index];
};

PathExpression.prototype.get = async function(operationContext, parentExpr) {
	const me = this;
	const evaluate = async function(node) {
		const traverselPath = [].concat(node);
		const traversedPath = [];
		let handle;
		let current;

		while (current = traverselPath.shift()) {
			if (typer.isCustomValue(current)) {
				handle = current;
			} else if (current?.isExpression) {
				handle = await current.get(operationContext, me.expr);
			} else if (current?.type === 'path') {
				traversedPath.push(current.value);
			} else {
				console.error(current);
				throw new Error('Unexpected handle');
			}
		}

		return {
			handle: handle,
			path: traversedPath
		};
	};

	console.log('PathExpression', 'get', 'expr', me.expr);

	const resultExpr = await evaluate(me.expr);

	if (resultExpr.path[0] === 'self') {
		const functionContext = operationContext.getMemory('functionContext');

		if (functionContext.context) {
			resultExpr.handle = functionContext.context;
		}
	}

	if (!parentExpr) {
		if (resultExpr.handle) {
			if (typer.isCustomMap(resultExpr.handle)) {
				const handlePath = resultExpr.path.slice(1);
				const context = resultExpr.handle;
				const value = await context.get(handlePath);
 
		 		if (value?.isOperation) {
		 			return value.run(operationContext);
		 		}

		 		return value;
			}

			return typer.cast(resultExpr.handle.callMethod(resultExpr.path.join('.')));
		}

		const value = await operationContext.get(resultExpr.path);
 
 		if (value instanceof Function) {
 			const callable = await operationContext.getCallable(pathExpr.path);

 			return callable.origin.call(callable.context);
 		} else if (value?.isOperation) {
 			return value.run(operationContext);
 		}

 		return value;
	}

	return resultExpr;
};

module.exports = PathExpression;