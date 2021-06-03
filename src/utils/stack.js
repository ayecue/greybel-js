const Stack = function() {
	const me = this;
	me.currentStack = [];
	return me;
};

Stack.prototype.get = function(offset) {
	const me = this;
	const currentStack = me.currentStack;
	if (offset == null) offset = 0;
	const index = currentStack.length - offset - 1;
	if (index < 0) return null;
	return currentStack[index];
};

Stack.prototype.push = function(o) {
	const me = this;
	me.currentStack.push(o);
	return me;
};

Stack.prototype.pop = function() {
	const me = this;
	me.currentStack.pop();
	return me;
};

module.exports = Stack;
