const EXPOSED_METHODS = [
	'split',
	'remove',
	'hasIndex',
	'indexOf',
	'lastIndexOf',
	'replace',
	'trim',
	'indexes',
	'code',
	'len',
	'lower',
	'upper',
	'val',
	'values',
	'to_int'
];

const CustomString = function(value) {
	const me = this;
	me.value = value;
	return me;
};

CustomString.prototype.slice = function(a, b) {
	return new CustomString(this.value.slice(a?.valueOf(), b?.valueOf()));
};

CustomString.prototype[Symbol.iterator] = function() {
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

CustomString.prototype.isNumber = function(value) {
	return !Number.isNaN(Number(value));
};

CustomString.prototype.toIndex = function(value) {
	const me = this;
	const casted = Number(value);

	return casted < 0 ? me.value.length + casted : casted;
};

CustomString.prototype.callMethod = function(method, ...args) {
	const me = this;
	const member = method[0]?.valueOf ? method[0].valueOf() : method[0];

	if (me.isNumber(member)) {
		const index = me.toIndex(member);

		if (!me.value[index]) {
			console.error(method, member, args);
			throw new Error(`Unexpected index`);
		}

		const value = new CustomString(me.value[index]);

		if (method.length > 1) {
			return value.callMethod(method.slice(1), ...args);
		}

		return value;
	}

	if (!EXPOSED_METHODS.includes(member)) {
		throw new Error(`Cannot access ${member} in string`);
	}

	return me[member].call(me, ...args);
};

CustomString.prototype.getType = function() {
	return 'string';
};

CustomString.prototype.valueOf = function() {
	const me = this;
	return me.len() === 0 ? null : me.value;
};

CustomString.prototype.toString = function() {
	return `"${this.value.toString()}"`;
};

CustomString.prototype.fork = function() {
	return new CustomString(this.value);
};

//exposed methods
CustomString.prototype.split = function(seperator) {
	return this.value.split(seperator.valueOf());
};

CustomString.prototype.remove = function(substr) {
	return this.value.remove(substr.valueOf());
};

CustomString.prototype.hasIndex = function(index) {
	return typeof this.value[index.valueOf()] === 'string';
};

CustomString.prototype.indexOf = function(substr, begin = 0) {
	const index = this.value.indexOf(substr.valueOf(), begin.valueOf());
	return index === -1 ? null : index;
};

CustomString.prototype.lastIndexOf = function(substr) {
	const index = this.value.lastIndexOf(substr.valueOf());
	return index === -1 ? null : index;
};

CustomString.prototype.replace = function(search, replaceWith) {
	return this.value.replace(search.valueOf(), replaceWith.valueOf());
};

CustomString.prototype.trim = function() {
	return this.value.trim();
};

CustomString.prototype.indexes = function() {
	return Object.keys(this.value).map((v) => parseInt(v));
};

CustomString.prototype.code = function() {
	return this.value.charCodeAt(0);
};

CustomString.prototype.len = function() {
	return this.value.length;
};

CustomString.prototype.lower = function() {
	return this.value.toLowerCase();
};

CustomString.prototype.upper = function() {
	return this.value.toUpperCase();
};

CustomString.prototype.val = function() {
	const v = parseFloat(this.value);
	return Number.NaN === v ? 0 : v;
};

CustomString.prototype.values = function() {
	return Object.values(this.value);
};

CustomString.prototype.to_int = function() {
	const v = parseInt(this.value);
	return Number.NaN === v ? this.value : v;
};

module.exports = CustomString;