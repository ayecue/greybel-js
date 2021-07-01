const CustomBoolean = function(value) {
	const me = this;
	me.value = value;
	return me;
};

CustomBoolean.prototype.getType = function() {
	return 'boolean';
};

CustomBoolean.prototype.valueOf = function() {
	return this.value;
};

CustomBoolean.prototype.toString = function() {
	return this.value.toString();
};

CustomBoolean.prototype.fork = function() {
	return new CustomBoolean(this.value);
};

module.exports = CustomBoolean;