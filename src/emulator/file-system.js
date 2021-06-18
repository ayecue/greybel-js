const path = require('path');

const FileSystem = function(fileSystem) {
	const me = this;

	me.map = fileSystem.map;
	me.rootFolder = fileSystem.rootFolder;
	me.path = null;
	
	return me;
};

FileSystem.prototype.exists = function(path) {
	return this.map.hasOwnProperty(path);
};

FileSystem.prototype.resolve = function(...args) {
	//ugly needs work
	const resolvedPath = path.resolve(...args);

	return resolvedPath && resolvedPath
		.replace(/\\/g,'/')
		.replace(/^[a-z]:/i,'')
		.replace(/^\/\//, '/')
		.replace(/\/$/, '') || '/';
};

FileSystem.prototype.get = function(target) {
	const me = this;
	if (me.exists(target)) {
		return me.map[target];
	}
};

module.exports = FileSystem;