const Exit = function(message) {
	const me = this;

	me.message = message;
};

Exit.prototype.getMessage = function() {
	return this.message;
};

module.exports = Exit;