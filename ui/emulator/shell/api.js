const API = {
	cd: function(params) {
		const me = this;
		const target = params.shift();

		me.computer.fileSystem.cd(target);
	}
};

module.exports = function(target) {
	return API[target];
};