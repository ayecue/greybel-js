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

FileSystem.prototype.set = function(target) {
	const me = this;
	if (!me.exists(target)) {
		console.error(`Path ${target} does not exist.`);
		return me;
	}
	me.path = target;
	return me;
};

FileSystem.prototype.cd = function(target) {
	const me = this;
	const newPath = me.resolve(me.cwd(), target) || '/';
	me.set(newPath);
	return me;
};

FileSystem.prototype.cwd = function() {
	return this.path;
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

FileSystem.prototype.getByPath = function(target) {
	const me = this;
	target = me.resolve(target);
	if (me.exists(target)) {
		return me.map[target];
	}
};

module.exports = FileSystem;