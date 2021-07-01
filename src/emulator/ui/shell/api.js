const API = {
	cd: function(params) {
		const me = this;
		const target = params.shift();

		me.cd(target);
	},
	exit: function() {
		const me = this;

		me.vm.removeLastSession();
		me.exit = true;
	},
	clear: function() {
		const me = this;

		me.clear();
	}
};

module.exports = function(target) {
	return API[target];
};