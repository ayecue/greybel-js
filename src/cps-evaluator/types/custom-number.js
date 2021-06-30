const CustomNumber = function(value) {
	const me = this;
	me.value = value;
	return me;
};

CustomNumber.prototype.getType = function() {
	return 'number';
};

CustomNumber.prototype.valueOf = function() {
	return this.value;
};

CustomNumber.prototype.toString = function() {
	return this.value.toString();
};

CustomNumber.prototype.fork = function() {
	return new CustomNumber(this.value);
};

module.exports = CustomNumber;