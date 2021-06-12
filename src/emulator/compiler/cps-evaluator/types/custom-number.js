const CustomNumber = function(value) {
	const me = this;
	me.value = value;
	return me;
};

CustomNumber.prototype.valueOf = function() {
	return this.value;
};

module.exports = CustomNumber;