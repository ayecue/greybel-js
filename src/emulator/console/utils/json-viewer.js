const parser = function(origin, maxDepth = 4) {
	const getRaw = function(obj) {
		if (obj?.isScope) {
			return obj.refs;
		} else if (obj?.isFunction) {
			return '[Function]';
		} else if (obj?.value != null) {
			return obj.value;
		}

		return obj;
	};
	const decycle = function(obj, stack = [], depth = 0) {
		obj = getRaw(obj);

		if (!obj || typeof obj !== 'object') {
			return obj;
		}

		if (stack.includes(obj) && depth > maxDepth) {
			return '[Cyclic Object]';
		}

		let s = stack.concat([obj]);

		return Array.isArray(obj)
			? obj.map(x => decycle(x, s, depth + 1))
			: Object.fromEntries(
				Object.entries(obj)
					.map(([k, v]) => [k, decycle(v, s, depth + 1)])
			);
	};

	return decycle(origin);
};

module.exports = function(scope) {
	return JSON.stringify(parser(scope), null, 4);
};