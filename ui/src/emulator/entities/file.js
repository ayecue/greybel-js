const fileClient = require('../api/file');

const File = function(data) {
	const me = this;

	me.id = data.ID;
	me.isBinary = data.isBinario;
	me.isLibrary = data.isLibrary;
	me.name = data.nombre;
	me.permissions = data.permisos.permisos;
	me.owner = data.owner;
	me.group = data.group;
	me.commando = data.comando;
	me.isProtected = data.isProtected;
	me.isScript = data.isScript;
	me.size = data.size;
	me.isLog = data.isLog;
	me.isFolder = false;
	me.description = data.desc;
	me.path = null;
	me.content = '';

	return me;
};

File.prototype.getAttribute = function(key) {
	const me = this;
	if (me.hasOwnProperty(key)) return me[key];
};

File.prototype.load = function() {
	const me = this;
	const content = fileClient.get(me.id);
	me.setContent(content);
	return me;
};

File.prototype.setContent = function(content) {
	const me = this;
	me.content = content;
	return me;
};

File.prototype.getContent = function() {
	return this.content;
};

File.prototype.getName = function() {
	return this.name;
};

File.prototype.getPath = function(path) {
	return this.path;
};

File.prototype.setPath = function(path) {
	const me = this;
	me.path = path;
	return me;
};

module.exports = File;