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
	me.value = value;
	return me;
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
	return me.value
		.map((item) => item?.valueOf()?.toString())
		.join(',');
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
	
	return origin;
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
	const member = method[0]?.valueOf ? method[0].valueOf() : method[0];

	if (method.length > 1) {
		if (me.value[member]) {
			return me.value[member].callMethod(method.slice(1), ...args);
		}

		console.error(method, member, args);
		throw new Error(`Unexpected method path`);
	}

	if (me.value.hasOwnProperty(member)) {
		return me.value[member];
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