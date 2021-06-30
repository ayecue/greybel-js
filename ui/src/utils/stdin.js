const uuidv4 = require('uuid').v4; 

const Stdin = function(target) {
	const me = this;
	me.queue = [];
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

Stdin.prototype.setType = function(type) {
	const me = this;
	me.target.type = type;
};

Stdin.prototype.waitForInput = function() {
	const me = this;
	const target = me.target;
	const id = uuidv4();

	me.queue.unshift(id);

	return new Promise((resolve) => {
		const handler = (evt) => {
			if (evt.keyCode === 13) {
				const currentId = me.queue[0];

				if (id === currentId) {
					evt.stopImmediatePropagation();
					me.queue.shift();
					target.removeEventListener('keydown', handler);
					resolve();
				}
			}
		};

		target.addEventListener('keydown', handler);
	});
};

module.exports = Stdin;