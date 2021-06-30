const CustomNil = function() {
	const me = this;
	return me;
};

CustomNil.prototype.valueOf = function() {
	return null;
};

CustomNil.prototype.toString = function() {
	return 'null';
};

CustomNil.prototype.getType = function() {
	return 'null';
};

module.exports = CustomNil;