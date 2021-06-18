const CustomNumber = require('./custom-number');

const EXPOSED_METHODS = [
	'remove',
	'hasIndex',
	'push',
	'indexOf',
	'indexes',
	'len',
	'pop',
	'shuffle',
	'sum',
	'values'
];

const CustomMap = function(value) {
	const me = this;
	me.isInstance = false;
	me.value = value;
	return me;
};

CustomMap.prototype[Symbol.iterator] = function() {
	const me = this;
	let index = 0;
	return  {
		next: function() {
			const keys = Object.keys(me.value);

			if (index === keys.length) {
				return {
					done: true
				};
			}

			const key = keys[index++];

			return {
				value: {
					key: key,
					value: me.value[key]
				},
				done: false
			};
		}
	};
};

CustomMap.prototype.valueOf = function() {
	const me = this;
	const value = me.value;

	return Object
		.keys(value)
		.filter((v) => v !== '__isa')
		.length === 0 ? null : me;
};

CustomMap.prototype.getType = function() {
	const me = this;
	const value = me.value;

	if (value.__isa) {
		return value.__isa;
	}

	return 'map';
};

CustomMap.prototype.extend = function(value) {
	const me = this;
	me.value = {
		...me.value,
		...value
	};
	return me;
};

CustomMap.prototype.set = async function(path, value) {
	const me = this;
	const traversalPath = [].concat(path);
	const refs = me.value;
	const last = traversalPath.pop();
	let origin = refs;
	let current;

	while (current = traversalPath.shift()) {
		if (current in origin) {
			origin = origin[current];

			if (origin instanceof CustomMap) {
				return origin.set(traversalPath.concat([last]), value);
			}
		} else {
			throw new Error(`Cannot set path ${path.join('.')}`);
		}
	}

	if (origin) {
		origin[last] = value; 
	} else {
		throw new Error(`Cannot set path ${path.join('.')}`);
	}
};

CustomMap.prototype.get = async function(path) {
	const me = this;

	if (path.length === 0) {
		return me;
	}

	const traversalPath = [].concat(path);
	const refs = me.value;
	let origin = refs;
	let current;

	while (current = traversalPath.shift()) {
		if (current in origin) {
			origin = origin[current];

			if (traversalPath.length > 0 && origin instanceof CustomMap) {
				return origin.get(traversalPath);
			}
		} else if (path.length === 1 && EXPOSED_METHODS.includes(current)) {
			return me[current];
		} else {
			throw new Error(`Cannot get path ${path.join('.')}`);
		}
	}
	
	return origin?.valueOf() || origin;
};

CustomMap.prototype.getCallable = async function(path) {
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

			if (origin instanceof CustomMap) {
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

CustomMap.prototype.createInstance = function() {
	const me = this;
	const value = {};
	const newInstance = new CustomMap(value);

	newInstance.isInstance = true;
	
	Object.entries(me.value).forEach(([key, item]) => {
		if (item?.isFunction) {
			value[key] = item.fork(newInstance);
		} else {
			value[key] = item?.fork() || item;
		}
	});
	
	return newInstance;
};

CustomMap.prototype.callMethod = function(method, ...args) {
	const key = method[0];

	if (method.length > 1) {
		if (me.value[key]) {
			return me.value[key].callMethod(method.slice(1), ...args);
		}

		throw new Error(`Unexpected method path`);
	}

	if (!EXPOSED_METHODS.includes(key)) {
		throw new Error(`Cannot access ${key} in map`);
	}

	return this[key].call(this, ...args);
};

//exposed methods
CustomMap.prototype.remove = function(key) {
	const me = this;
	key = key.valueOf();

	if (key in me.value) {
		me.value[key] = null;
		delete me.value[key];
		return 1;
	}

	return 0;
};

CustomMap.prototype.hasIndex = function(key) {
	return this.value.hasOwnProperty(key.valueOf());
};

CustomMap.prototype.indexOf = function(key) {
	const me = this;
	const keys = Object.keys(me.value);
	const index = keys.indexOf(key);

	if (index === -1) {
		return null;
	}

	return keys[index];
};

CustomMap.prototype.push = function(key) {
	const me = this;
	me.value[key.valueOf()] = new CustomNumber(1);
	return me;
};

CustomMap.prototype.indexes = function() {
	const me = this;
	return Object.keys(me.value);
};

CustomMap.prototype.len = function() {
	const me = this;
	return Object.keys(me.value).length;
};

CustomMap.prototype.pop = function() {
	const me = this;
	const keys = Object.keys(me.value);

	if (keys.length > 0) {
		me.remove(keys[0]);
		return me;
	}

	return me;
};

CustomMap.prototype.shuffle = function() {
	const me = this;
	const value = me.value;
	const keys = Object.keys(me.value);

	for (let i = keys.length - 1; i > 0; i--) {
		const j = Math.floor(Math.random() * (i + 1));
		[value[keys[i]], value[keys[j]]] = [value[keys[j]], value[keys[i]]];
	}
};

CustomMap.prototype.sum = function() {
	return Object.values(this.value).reduce((result, v) => result + v?.valueOf(), 0);
};

CustomMap.prototype.values = function() {
	return Object.values(this.value);
};

module.exports = CustomMap;