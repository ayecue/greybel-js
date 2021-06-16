const Stdin = function(target) {
	const me = this;
	me.target = target;
};

Stdin.prototype.enable = function() {
	const me = this;
	me.target.disabled = false;
};

Stdin.prototype.disable = function() {
	const me = this;
	me.target.disabled = true;
};

Stdin.prototype.focus = function() {
	const me = this;
	me.target.focus();
};

Stdin.prototype.getValue = function() {
	const me = this;
	return me.target.value;
};

Stdin.prototype.clear = function() {
	const me = this;
	me.target.value = '';
};

Stdin.prototype.waitForInput = function() {
	const me = this;
	const target = me.target;

	return new Promise((resolve) => {
		const handler = (evt) => {
			if (evt.keyCode === 13) {
				target.removeEventListener('keydown', handler);
				resolve();
			}
		};

		target.addEventListener('keydown', handler);
	});
};

module.exports = Stdin;