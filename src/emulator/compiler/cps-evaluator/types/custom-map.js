const CustomMap = function(value) {
	const me = this;
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
		if (current?.isCallable) {
			current = await current.run(me.context);
		}

		if (current?.isIdentifier) {
			current = current.valueOf();
		}

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
		if (current?.isCallable) {
			current = await current.run(me.context);
		}

		if (current?.isIdentifier) {
			current = current.valueOf();
		}

		if (current in origin) {
			origin = origin[current];

			if (traversalPath.length > 0 && origin instanceof CustomMap) {
				return origin.get(traversalPath);
			}
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
		if (current?.isCallable) {
			current = await current.run(me.context);
		}

		if (current?.isIdentifier) {
			current = current.valueOf();
		}

		if (current in refs) {
			context = origin;
			origin = origin[current];

			if (origin instanceof CustomMap) {
				return origin.getCallable(traversalPath);
			}
		} else {
			throw new Error(`Cannot get path ${path.join('.')}`);
		}
	}

	return {
		callback: origin,
		context: context
	};
};

CustomMap.prototype.getPath = async function(path) {
	const me = this;
	const traversalPath = [].concat(path);
	const refs = me.value;
	const traversedPath = [];
	let origin = refs;
	let current;

	while (current = traversalPath.shift()) {
		if (current?.isCallable) {
			current = await current.run(me.context);
		}

		if (current?.isIdentifier) {
			current = current.valueOf();
		}

		if (current in origin) {
			traversedPath.push(current);
			origin = origin[current];

			if (origin instanceof CustomMap) {
				const result = await origin.getPath(traversalPath);

				return {
					completed: result.completed,
					path: traversedPath.concat(result.path)
				};
			}
		} else {
			return {
				completed: traversalPath.length === 0,
				path: traversedPath.concat(Array.isArray(current) ? current : [current])
			};
		}
	}
	
	return {
		completed: true,
		path: traversedPath
	};
};

module.exports = CustomMap;