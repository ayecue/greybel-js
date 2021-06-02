const varNamespaces = require('./var-namespaces');
const md5 = require('./md5');

const Literals = function() {
	const me = this;
	me.mapping = {};
	return me;
};

Literals.prototype.reset = function() {
	const me = this;
	me.mapping = {};
	return me;
};

Literals.prototype.add = function(literal) {
	const me = this;
	const raw = literal.raw.toString();
	if (!me.mapping.hasOwnProperty(raw)) {
		me.mapping[raw] = {
			literal: literal,
			amount: 1,
			length: raw.length,
			namespace: null
		};
	} else {
		const literal = me.mapping[raw];
		const amount = literal.amount + 1;
		const length = literal.length + raw.length;

		literal.amount = amount;
		literal.length = length;

		if (length > 10 && amount > 2 && literal.namespace == null) {
			literal.namespace = varNamespaces.createNamespace(md5(raw));
		}
	}
	return me;
};

Literals.prototype.get = function(literal) {
	const me = this;
	const raw = literal.raw.toString();
	if (me.mapping.hasOwnProperty(raw)) {
		return me.mapping[raw];
	}
	return null;
};

Literals.prototype.getMapping = function() {
	return this.mapping;
};

module.exports = new Literals();