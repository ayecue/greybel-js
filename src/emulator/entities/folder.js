const Folder = function(data) {
	const me = this;

	me.name = data.nombre;
	me.permissions = data.permisos.permisos;
	me.owner = data.owner;
	me.group = data.group;
	me.commando = data.comando;
	me.isProtected = data.isProtected;
	me.isScript = data.isScript;
	me.isLog = data.isLog;
	me.size = data.size;
	me.files = null;
	me.folders = null;
	me.path = null;
	me.isFolder = true;

	return me;
};

Folder.prototype.getAttribute = function(key) {
	const me = this;
	if (me.hasOwnProperty(key)) return me[key];
};

Folder.prototype.getName = function() {
	return this.name;
};

Folder.prototype.getPath = function(path) {
	return this.path;
};

Folder.prototype.setFolders = function(folders) {
	const me = this;
	me.folders = folders;
	return me;
};

Folder.prototype.setFiles = function(files) {
	const me = this;
	me.files = files;
	return me;
};

Folder.prototype.setPath = function(path) {
	const me = this;
	me.path = path;
	return me;
};

module.exports = Folder;