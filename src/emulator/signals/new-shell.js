const NewShell = function(shell) {
	const me = this;

	me.shell = shell;
};

NewShell.prototype.getShell = function() {
	return this.shell;
};

module.exports = NewShell;