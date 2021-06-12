const EXPOSED_METHODS = [
	'join',
	'remove',
	'hasIndex',
	'indexOf',
	'lastIndexOf',
	'len',
	'pull',
	'pop'
];

const CustomList = function(value) {
	const me = this;
	me.value = value;
	return me;
};

CustomList.prototype.concat = function(arr) {
	return new CustomList(this.value.concat(arr.value));
};

CustomList.prototype.slice = function(a, b) {
	return new CustomList(this.value.slice(a?.valueOf(), b?.valueOf()));
};

CustomList.prototype[Symbol.iterator] = function() {
	const me = this;
	let index = 0;
	return  {
		next: function() {
			if (index === me.value.length) {
				return {
					done: true
				};
			}

			return {
				value: me.value[index++],
				done: false
			};
		}
	};
};

CustomList.prototype.get = async function(path) {
	const me = this;
	const traversalPath = [].concat(path);
	const refs = me.value;
	let origin = refs;
	let current;

	while (current = traversalPath.shift()) {
		if (current in origin) {
			origin = origin[current];

			if (traversalPath.length > 0 && origin instanceof CustomList) {
				return origin.get(traversalPath);
			}
		} else if (path.length === 1 && EXPOSED_METHODS.includes(current)) {
			return me[current];
		} else {
			console.error(origin, path);
			throw new Error(`Cannot get path ${path.join('.')}`);
		}
	}
	
	return origin?.valueOf() || origin;
};

CustomList.prototype.getCallable = async function(path) {
	const me = this;
	const traversalPath = [].concat(path);
	const refs = me.value;
	let origin = refs;
	let context;
	let current;

	while (current = traversalPath.shift()) {
		if (current in origin) {
			context = origin;
			origin = origin[current];

			if (origin instanceof CustomList) {
				return origin.getCallable(traversalPath);
			}
		} else if (path.length === 1 && EXPOSED_METHODS.includes(current)) {
			return {
				origin: me[current],
				context: me
			};
		} else {
			throw new Error(`Cannot get path ${path.join('.')}`);
		}
	}

	return {
		origin: origin,
		context: context
	};
};

CustomList.prototype.callMethod = function(method, ...args) {
	const me = this;

	if (method.length > 1) {
		const index = method[0];

		if (me.value[index]) {
			return me.value[index].callMethod(method.slice(1), ...args);
		}

		throw new Error(`Unexpected method path`);
	}

	if (me.value[method[0]]) {
		return me.value[method[0]];
	}

	if (!EXPOSED_METHODS.includes(method[0])) {
		throw new Error(`Cannot access ${method} in list`);
	}

	return me[method[0]].call(me, ...args);
};

//exposed methods
CustomList.prototype.join = function(seperator) {
	return this.value
		.map((v) => v.valueOf())
		.join(seperator.valueOf());
};

CustomList.prototype.remove = function(index) {
	this.value.splice(index, 1);
};

CustomList.prototype.hasIndex = function(index) {
	return this.value.hasOwnProperty(index.valueOf());
};

CustomList.prototype.indexOf = function(val, begin = 0) {
	const index = this.value.indexOf(val.valueOf(), begin.valueOf());
	return index === -1 ? null : index;
};

CustomList.prototype.lastIndexOf = function(val) {
	const index = this.value.lastIndexOf(val.valueOf());
	return index === -1 ? null : index;
};

CustomList.prototype.pull = function() {
	return this.value.shift();
};

CustomList.prototype.pop = function() {
	return this.value.pop();
};

CustomList.prototype.len = function() {
	return this.value.length;
};

module.exports = CustomList;