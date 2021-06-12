const CustomNil = function() {
	const me = this;
	return me;
};

CustomNil.prototype.valueOf = function() {
	return null;
};

module.exports = CustomNil;