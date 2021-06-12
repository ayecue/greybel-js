const CustomBoolean = function(value) {
	const me = this;
	me.value = value;
	return me;
};

CustomBoolean.prototype.valueOf = function() {
	return this.value;
};

module.exports = CustomBoolean;