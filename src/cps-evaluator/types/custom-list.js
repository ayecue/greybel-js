const EXPOSED_METHODS = [
	'join',
	'remove',
	'hasIndex',
	'indexOf',
	'lastIndexOf',
	'len',
	'pull',
	'pop',
	'push',
	'sum',
	'values',
	'indexes',
	'sort',
	'reverse',
	'shuffle'
];

const CustomList = function(value) {
	const me = this;
	me.isObject = true;
	me.value = value;
	return me;
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

CustomList.prototype.getType = function() {
	return 'list';
};

CustomList.prototype.valueOf = function() {
	const me = this;
	return me.len() === 0 ? null : me;
};

CustomList.prototype.toString = function() {
	const me = this;
	const body = me.value.map((item) => item?.valueOf()?.toString());

	return `[${body.join(',')}]`;
};

CustomList.prototype.concat = function(arr) {
	return new CustomList(this.value.concat(arr.value));
};

CustomList.prototype.slice = function(a, b) {
	return new CustomList(this.value.slice(a?.valueOf(), b?.valueOf()));
};

//Probably needs work
CustomList.prototype.set = async function(path, value) {
	const me = this;
	const traversalPath = [].concat(path);
	const refs = me.value;
	const last = traversalPath.pop();
	const current = traversalPath.shift();
	let origin = refs;

	if (current != null) {
		if (current in origin) {
			origin = origin[current];

			if (origin?.isObject) {
				return origin.set(traversalPath.concat([last]), value);
			}
		} else {
			throw new Error(`Cannot set path ${path.join('.')}`);
		}
	}

	if (origin) {
		if (value?.isFunction) {
			origin[last] = value.fork(me);
		} else {
			origin[last] = value;
		}
	} else {
		throw new Error(`Cannot set path ${path.join('.')}`);
	}
};

//Probably needs work
CustomList.prototype.get = async function(path) {
	const me = this;

	if (path.length === 0) {
		return me;
	}

	const traversalPath = [].concat(path);
	const refs = me.value;
	const current = traversalPath.shift();
	let origin = refs;

	if (current != null) {
		if (current in origin) {
			origin = origin[current];

			if (traversalPath.length > 0 && origin?.isObject) {
				return origin.get(traversalPath);
			}
		} else if (path.length === 1 && EXPOSED_METHODS.includes(current)) {
			return me[current];
		} else {
			throw new Error(`Cannot get path ${path.join('.')}`);
		}
	}
	
	return origin;
};

//Probably needs work
CustomList.prototype.getCallable = async function(path) {
	const me = this;
	const traversalPath = [].concat(path);
	const refs = me.value;
	const current = traversalPath.shift();
	let origin = refs;
	let context;

	if (current != null) {
		if (current in origin) {
			context = origin;
			origin = origin[current];

			if (origin?.isObject) {
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

CustomList.prototype.isNumber = function(value) {
	return !Number.isNaN(Number(value));
};

CustomList.prototype.toIndex = function(value) {
	const me = this;
	const casted = Number(value);

	return casted < 0 ? me.value.length + casted : casted;
};

CustomList.prototype.callMethod = function(method, ...args) {
	const me = this;
	const member = method[0]?.valueOf ? method[0].valueOf() : method[0];

	if (me.isNumber(member)) {
		const index = me.toIndex(member);

		if (!me.value.hasOwnProperty(index)) {
			console.error(method, member, args);
			throw new Error(`Unexpected index`);
		}

		if (method.length > 1) {
			return me.value[index].callMethod(method.slice(1), ...args);
		}

		return me.value[index];
	}

	if (!EXPOSED_METHODS.includes(member)) {
		throw new Error(`Cannot access ${method} in list`);
	}

	return me[member].call(me, ...args);
};

//exposed methods
CustomList.prototype.join = function(seperator) {
	return this.value
		.map((v) => v.valueOf())
		.join(seperator.valueOf() || '');
};

CustomList.prototype.remove = function(index) {
	this.value.splice(index, 1);
};

CustomList.prototype.hasIndex = function(index) {
	const me = this;

	index = index.valueOf();

	if (!me.isNumber(index)) {
		throw new Error(`Unexpected index`);
	}

	index = me.toIndex(index);

	return this.value.hasOwnProperty(index);
};

CustomList.prototype.indexOf = function(val, begin = 0) {
	const index = this.value.indexOf(val.valueOf(), begin.valueOf());
	return index === -1 ? null : index;
};

CustomList.prototype.lastIndexOf = function(val) {
	const index = this.value.lastIndexOf(val.valueOf());
	return index === -1 ? null : index;
};

CustomList.prototype.push = function(val) {
	const me = this;
	me.value.push(val);
	return me;
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

CustomList.prototype.shuffle = function() {
	const me = this;
	const value = me.value;

	for (let i = value.length - 1; i > 0; i--) {
		const j = Math.floor(Math.random() * (i + 1));
		[value[i], value[j]] = [value[j], value[i]];
	}
};

CustomList.prototype.reverse = function() {
	this.value.reverse();
};

CustomList.prototype.sort = function(key) {
	key = key ? key.valueOf() : null;

	return this.value.sort((a, b) => {
		a = a.value;
		b = b.value;

		if (key) {
			a = a[key].value;
			b = b[key].value;
		}

		if (typeof a === 'string' && typeof b === 'string') {
			return a.localCompare(b);
		}
		return a - b;
	});
};

CustomList.prototype.indexes = function() {
	return Object.keys(this.value).map((v) => parseInt(v));
};

CustomList.prototype.values = function() {
	return this.value;
};

CustomList.prototype.sum = function() {
	return this.value.reduce((result, v) => result + v?.valueOf(), 0);
};

module.exports = CustomList;