const CurrentVersion = function(libraryName, data) {
	const me = this;

	me.library = libraryName;
	me.version = data.version.join('.');

	return me;
};

module.exports = CurrentVersion;