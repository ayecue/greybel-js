const Stack = require('../../../../utils/stack');

const Transformer = function(mapper) {
	const me = this;

	me.currentStack = new Stack();
	me.context = {
		mapper: mapper,
		stack: me.currentStack
	};
	me.buildMap = mapper(me.make.bind(me), me.currentStack.get.bind(me.currentStack), me.currentStack.depth.bind(me.currentStack), me.context);

	return me;
}

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

Transformer.prototype.transform = function(chunk) {
	const me = this;

	if ('Chunk' !== chunk.type) {
		throw new Error('Expects chunk');
	}

	return me.make(chunk);
};

module.exports = Transformer;
