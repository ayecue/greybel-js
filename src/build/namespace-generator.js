const NamespaceGenerator = function(characters, forbidden, defaultNamespaces) {
	const me = this;
	me.buffer = [0];
	me.mapping = {};
	me.rmapping = {};
	me.forbidden = forbidden;
	me.characters = characters;
	me.defaultNamespaces = defaultNamespaces;
	me.preset();
	return me;
};

NamespaceGenerator.prototype.reset = function() {
	const me = this;
	me.buffer = [0];
	me.mapping = {};
	me.rmapping = {};
	me.preset();
	return me;
};

NamespaceGenerator.prototype.preset = function() {
	const me = this;
	let defaultNamespace;

	for (defaultNamespace of me.defaultNamespaces) {
		me.createNamespace(defaultNamespace);
	}

	return me;
};

NamespaceGenerator.prototype.get = function(key) {
	const mapping = this.mapping;
	if (mapping.hasOwnProperty(key)) return mapping[key];
	return null;
};

NamespaceGenerator.prototype.increaseBuffer = function(i) {
	const me = this;
	const currentCharBuffer = me.buffer;
	const maxBufferSize = me.characters.length;
	if (i == null) i = currentCharBuffer.length - 1;
	let p = currentCharBuffer[i];
	p = p + 1;
	currentCharBuffer[i] = p;
	if (p == maxBufferSize) {;
		currentCharBuffer[i] = 0;
		if (i == 0) {
			currentCharBuffer.push(0);
		} else {
			me.increaseBuffer(i - 1);
		}
	}
};

NamespaceGenerator.prototype.generateNamespace = function() {
	const me = this;
	const currentCharBuffer = me.buffer;
	const generatorCharacters = me.characters;
	const forbiddenNamespaces = me.forbidden;
	let name = '';
	let index = 0;
	
	while (index < currentCharBuffer.length) {
		pointer = currentCharBuffer[index];
		name = name + generatorCharacters[pointer];
		if (index == currentCharBuffer.length - 1) me.increaseBuffer();
		index = index + 1;
	}
	
	if (forbiddenNamespaces.indexOf(name) != -1) return me.generateNamespace();
	
	return name;
};

NamespaceGenerator.prototype.createNamespace = function(value, isCollision) {
	if (isCollision == null) isCollision = false;
	const me = this;
	const mapping = me.mapping;
	const rmapping = me.rmapping;
	
	if (value in mapping && !isCollision) return;
	
	let namespace = me.generateNamespace();
	
	mapping[value] = namespace;
	rmapping[namespace] = value;
	
	if (value in rmapping) {
		const collisionValue = rmapping[value];
		rmapping[value] = null;
		delete rmapping[value];
		namespace = me.createNamespace(collisionValue, true);
	}

	return namespace;
};

module.exports = NamespaceGenerator