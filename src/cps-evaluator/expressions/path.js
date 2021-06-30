const typer = require('../typer');

const PathExpression = function(ast, visit, debug, raise) {
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

				if (node.index?.type === 'SliceExpression') {
					expression = append(expression, {
						type: 'slice',
						left: buildExpression(node.index.left),
						right: buildExpression(node.index.right)
					});
				} else {
					expression = append(expression, {
						type: 'index',
						value: buildExpression(node.index)
					});
				}

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

	me.ast = ast;
	me.expr = buildExpression(ast);
	me.isExpression = true;
	me.debug = debug;
	me.raise = raise;

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
		let traversedPath = [];
		let position = 0;
		let handle;
		let current;

		while (current = traverselPath.shift()) {
			if (typer.isCustomValue(current)) {
				handle = current;
			} else if (current?.isExpression) {
				handle = await current.get(operationContext, me.expr);
			} else if (current?.isOperation) {
				handle = await current.get(operationContext);
			} else if (current?.type === 'path') {
				if (current.value === 'self' && position === 0) {
					const functionContext = operationContext.getMemory('functionContext');

					if (functionContext?.context) {
						handle = functionContext.context;
					} else {
						me.raise('Unexpected self', me, current);
					}
				} else {
					traversedPath.push(current.value);

					if (traverselPath.length > 0) {
						const origin = await (handle || operationContext).get(traversedPath);

						if (typer.isCustomValue(origin)) {
							handle = origin;
							traversedPath = [];
						} else if (origin instanceof Function) {
							handle = await origin.call(handle);
							traversedPath = [];
						}
					}
				}
			} else if (current?.type === 'index') {
				current = current.value[0];

				if (typer.isCustomValue(current)) {
					traversedPath.push(current.valueOf());
				} else if (current?.isExpression) {
					const value = await current.get(operationContext);
					traversedPath.push(value);
				} else if (current?.type === 'path') {
					const value = await operationContext.get(current.value);
					traversedPath.push(value.valueOf());
				} else {
					me.raise('Unexpected index', me, current);
				}
			} else if (current?.type === 'slice') {
				if (!handle) {
					handle = await operationContext.get(traversedPath);
					traversedPath = [];
				} else if (!typer.isCustomList(handle)) {
					me.raise('Invalid type for slice', me, handle);
				}

				let left = current.left[0];

				if (typer.isCustomValue(left)) {
					left = left;
				} else if (node.left?.isExpression) {
					left = await left.get(operationContext);
				}

				let right = current.right[0];

				if (typer.isCustomValue(right)) {
					right = right;
				} else if (node.left?.isExpression) {
					right = await right.get(operationContext);
				}

				handle = handle.slice(left, right);
			} else {
				me.raise('Unexpected handle', me, current);
			}

			position++;
		}

		return {
			handle: handle,
			path: traversedPath
		};
	};

	me.debug('PathExpression', 'get', 'expr', me.expr);

	const resultExpr = await evaluate(me.expr);

	if (!parentExpr) {
		if (resultExpr.handle) {
			if (resultExpr.path.length === 0) {
				return resultExpr.handle;
			} else if (typer.isCustomMap(resultExpr.handle)) {
				const context = resultExpr.handle;
				const value = await context.get(resultExpr.path);
 
		 		if (value?.isOperation) {
		 			return value.run(operationContext);
		 		} else if (value instanceof Function) {
					return await value.call(context);
				}

		 		return value;
			}

			return typer.cast(resultExpr.handle.callMethod(resultExpr.path));
		}

		const value = await operationContext.get(resultExpr.path);
 
 		if (value instanceof Function) {
 			const callable = await operationContext.getCallable(resultExpr.path);

 			return typer.cast(await callable.origin.call(callable.context));
 		} else if (value?.isOperation) {
 			return value.run(operationContext);
 		}

 		return value;
	}

	return resultExpr;
};

module.exports = PathExpression;