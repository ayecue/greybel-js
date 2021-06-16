const Stdout = function(target) {
	const me = this;

	me.target = target;
	me.history = [];
};

Stdout.prototype.write = function(value) {
	const me = this;
	me.history.push(...value.split('\\n'));
	me.render();
};

Stdout.prototype.render = function() {
	const me = this;
	const target = me.target;
	target.value = me.history.join('\n');
	target.scrollTop = target.scrollHeight;
};

module.exports = Stdout;