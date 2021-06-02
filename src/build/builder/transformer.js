const Transformer = function(mapper) {
	const me = this;

	me.currentStack = [];
	me.context = {
		mapper: mapper
	};
	me.buildMap = mapper(me.make.bind(me), me.stack.bind(me), me.context);

	return me;
}

Transformer.prototype.stack = function(offset) {
	const me = this;
	const currentStack = me.currentStack;
	if (offset == null) offset = 0;
	const index = currentStack.length - offset - 1;
	if (index < 0) return null;
	return currentStack[index];
};

Transformer.prototype.make = function(o) {
	const me = this;
	const currentStack = me.currentStack;
	if (o == null) return '';
	if (o.type == null) {
		console.error('Error ast type:', o);
		throw new Error('Unexpected as type');
	}
	const fn = me.buildMap[o.type];
	if (fn == null) {
		console.error('Error ast:', o);
		throw new Error('Type does not exist ' + o.type);
	}
	currentStack.push(o);
	const result = fn(o);
	currentStack.pop();
	return result;
};

Transformer.prototype.transform = function(chunk, dependency) {
	const me = this;

	if ('Chunk' !== chunk.type) {
		throw new Error('Expects chunk');
	}

	me.context.dependency = dependency;

	return me.make(chunk);
};

module.exports = Transformer;
