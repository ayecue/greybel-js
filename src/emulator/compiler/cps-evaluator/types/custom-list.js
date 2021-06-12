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

CustomList.prototype.callMethod = function(method, ...args) {
	if (!EXPOSED_METHODS.includes(method)) {
		throw new Error(`Cannot access ${method} in list`);
	}

	return this[method].call(this, ...args);
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