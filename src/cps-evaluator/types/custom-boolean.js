const CustomBoolean = function(value) {
	const me = this;
	me.value = value;
	return me;
};

CustomBoolean.prototype.valueOf = function() {
	return this.value;
};

CustomBoolean.prototype.fork = function() {
	return new CustomBoolean(this.value);
};

module.exports = CustomBoolean;