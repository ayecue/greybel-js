const CustomMap = require('../cps-evaluator/types/custom-map');
const CustomList = require('../cps-evaluator/types/custom-list');
const CustomBoolean = require('../cps-evaluator/types/custom-boolean');
const CustomString = require('../cps-evaluator/types/custom-string');
const CustomNumber = require('../cps-evaluator/types/custom-number');
const CustomNil = require('../cps-evaluator/types/custom-nil');
const typer = require('../cps-evaluator/typer');

const TYPE = {
	'API': 'API',
	'GLOBAL': 'GLOBAL',
	'FUNCTION': 'FUNCTION',
	'LOOP': 'LOOP',
	'MAP': 'MAP',
	'CALL': 'CALL'
};

const STATE = {
	'TEMPORARY': 'TEMPORARY',
	'DEFAULT': 'DEFAULT'
};

const Scope = function(context) {
	const me = this;
	me.context = context;
	me.refs = {};
	return me;
};

Scope.prototype.valueOf = function() {
	return this.refs;
};

Scope.prototype.extend = function(map = {}) {
	const me = this;
	me.refs = {
		...me.refs,
		...map
	};
	return me;
};

Scope.prototype.set = async function(path, value) {
	const me = this;
	const traversalPath = [].concat(path);
	const refs = me.refs;
	const last = traversalPath.pop();
	const current = traversalPath.shift();
	let origin = refs;

	if (current != null) {
		if (current in origin) {
			origin = origin[current];

			if (
				origin?.isObject ||
				origin instanceof Scope
			) {
				return origin.set(traversalPath.concat([last]), value);
			}
		} else if (me?.context?.previous && !me.context.previous.isProteced) {
			return me.context.previous.set(path, value);
		} else if (traversalPath.length > 0) {
			throw new Error(`Cannot set path ${path.join('.')}`);
		}
	}
	
	if (
		origin &&
		!(origin instanceof CustomBoolean) &&
		!(origin instanceof CustomString) &&
		!(origin instanceof CustomNumber) &&
		!(origin instanceof CustomNil)
	) {
		origin[last] = value; 
	} else {
		throw new Error(`Cannot set path ${path.join('.')}`);
	}
};

Scope.prototype.get = async function(path) {
	const me = this;
	const traversalPath = [].concat(path);
	const refs = me.refs;
	const current = traversalPath.shift();
	let context;
	let origin = refs;

	if (current != null) {
		if (current in origin) {
			context = origin;
			origin = origin[current];
			
			if (
				traversalPath.length > 0 &&
				(
					origin?.isObject ||
					origin instanceof Scope
				)
			) {
				return origin.get(traversalPath);
			}
		} else if (me?.context?.previous) {
			return me.context.previous.get(path);
		} else {
			throw new Error(`Cannot get path ${path.join('.')}`);
		}
	}
	
	return origin;
};

Scope.prototype.getCallable = async function(path) {
	const me = this;
	const traversalPath = [].concat(path);
	const refs = me.refs;
	const current = traversalPath.shift();
	let origin = refs;
	let context;

	if (current != null) {
		if (current in origin) {
			context = origin;
			origin = origin[current];

			if (
				origin?.isObject ||
				origin instanceof Scope
			) {
				return origin.getCallable(traversalPath);
			}
		} else if (me?.context?.previous) {
			return me.context.previous.getCallable(path);
		} else {
			throw new Error(`Cannot get path ${path.join('.')}`);
		}
	}

	return {
		origin: origin,
		context: context
	};
};

const OperationContext = function(isProteced = false) {
	const me = this;
	me.previous = null;
	me.type = TYPE.API;
	me.state = STATE.DEFAULT;
	me.scope = new Scope(me);
	me.isProteced = isProteced;
	me.memory = {};
	return me;
};

OperationContext.prototype.valueOf = function() {
	return this.scope.valueOf();
};

OperationContext.prototype.extend = function(map) {
	const me = this;
	if (me.state === STATE.TEMPORARY) {
		me.previous.extend(map);
	} else {
		me.scope.extend(map);
	}
	return me;
};

OperationContext.prototype.set = async function(path, value) {
	const me = this;
	if (me.state === STATE.TEMPORARY) {
		await me.previous.set(path, value);
	} else {
		await me.scope.set(path, value);
	}
	return me;
};

OperationContext.prototype.get = function(path) {
	const me = this;
	if (me.state === STATE.TEMPORARY) {
		return me.previous.get(path);
	}
	return me.scope.get(path);
};

OperationContext.prototype.setMemory = function(key, value) {
	const me = this;
	me.memory[key] = value;
	return me;
};

OperationContext.prototype.getMemory = function(key) {
	const me = this;
	return me.memory[key];
};

OperationContext.prototype.getCallable = function(path) {
	const me = this;
	if (me.state === STATE.TEMPORARY) {
		return me.previous.getCallable(path);
	}
	return me.scope.getCallable(path);
};

OperationContext.prototype.fork = function(type, state) {
	const me = this;
	const opc = new OperationContext();

	opc.previous = me;
	opc.type = type;
	opc.state = state;

	if (me.state === STATE.FUNCTION || me.state === STATE.GLOBAL) {
		opc.extend({
			locals: opc.scope
		});
	}

	if (type !== TYPE.FUNCTION) {
		if (type !== TYPE.LOOP) {
			opc.setMemory('loopContext', me.getMemory('loopContext'));
		}

		opc.setMemory('functionContext', me.getMemory('functionContext'));
	}

	return opc;
};

exports.TYPE = TYPE;
exports.STATE = STATE;

module.exports = OperationContext;