const EXPOSED_METHODS = [
	'remove',
	'hasIndex'
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
			console.error(origin, path);
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
		if (current in refs) {
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
	if (!EXPOSED_METHODS.includes(method)) {
		throw new Error(`Cannot access ${method} in map`);
	}

	return this[method].call(this, ...args);
};

//exposed methods
CustomMap.prototype.remove = function(key) {
	const me = this;
	key = key.valueOf();

	me.value[key] = null;
	delete me.value[key];
};

CustomMap.prototype.hasIndex = function(key) {
	return this.value.hasOwnProperty(key.valueOf());
};

module.exports = CustomMap;