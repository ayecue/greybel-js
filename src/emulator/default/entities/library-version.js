const MemoryZone = require('./memory-zone');

const LibraryVersion = function(libraryName, data) {
	const me = this;

	me.library = libraryName;
	me.id = data.idLib;
	me.version = data.version.version.join('.');
	me.memoryZones = Object
		.entries(data.listaZonaMem)
		.map(([key, item]) => new MemoryZone(key, item));

	return me;
};

module.exports = LibraryVersion;