const CustomConditionOrBinaryExpressionCache = {};
const CustomConditionOrBinaryExpression = function(expression, identifier) {
	if (CustomConditionOrBinaryExpressionCache[expression]) return CustomConditionOrBinaryExpressionCache[expression];

	//parsing condition
	const Parser = require('expr-eval').Parser;
	const parser = new Parser({
		operators: {
			add: true,
			concatenate: true,
			conditional: true,
			divide: true,
			factorial: true,
			multiply: true,
			power: true,
			remainder: true,
			subtract: true,
			logical: true,
			comparison: true
		}
	});

	parser.binaryOps['+'] = function(a, b) {
		if (typeof a === 'string' || typeof b === 'string') return a + b;
		if (a.isCustomArray || b.isCustomArray) return (a || []).concat(b || []);
		return Number(a) + Number(b);
	};

	const safeCall = (cb) => {
		try {return cb();} catch (err) {}
	};

	//Evaluate conditional statement
	//console.log('Evaluating expression: ', expression);
	const result = parser
		.parse(expression)
		.evaluate(Object.entries(identifier).reduce((values, [key, eval]) => {
			let value = safeCall(eval);

			if (value && value.isCustomArray) {
				value = value.raw.length > 0 ? value : null;
			}

			return {
				...values,
				[key]: value === null || value === undefined ? false : value 
			};
		}, {}));

	return result;
};
const CustomList = function(...list) {
	const interface = {};

	interface.isCustomArray = true;
	interface.raw = list;

	interface.indexOf = function(str, lastIndex) {
		const index = list.indexOf(str, lastIndex);
		return index === -1 ? null : index;
	};

	interface.slice = function(startIndex, endIndex) {
		return CustomList(list.slice(startIndex, endIndex));
	};

	interface.get = function(index) {
		return list[index];
	};

	interface.concat = function(arr) {
		if (arr.isCustomArray) return CustomList(...list.concat(arr.raw));
		return CustomList(...list.concat(arr));
	};

	interface[Symbol.iterator] = function() {
		let index = 0;

		return {
			next: function() {
				return {
					done: index === list.length,
					value: list[index++]
				};
			}
		};
	};

	Object.defineProperty(interface, 'len', {
		enumerable: false,
		get: function() {
			return list.length;
		}
	});

	//needs to be reworked
	Object.entries(list).forEach(([key, value]) => {
		interface[key] = value;
	});

	return interface;
};
const CustomMap = function(map) {
	const interface = {};

	interface.hasIndex = function(key) {
		return interface.hasOwnProperty(key);
	};

	//needs to be reworked
	Object.entries(map).forEach(([key, value]) => {
		interface[key] = value;
	});

	return interface;
};