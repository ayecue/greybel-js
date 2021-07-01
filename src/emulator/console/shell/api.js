const scriptExecuter = require('../script-executer');
const chalk = require('chalk');
const path = require('path');
const fs = require('fs');

const API = {
	run: function(params) {
		const me = this;
		const target = params.shift();
		const cwd = process.cwd();
		const targetPath = path.resolve(cwd, target);

		if (!fs.existsSync(targetPath)) {
			console.error(`Path ${targetPath} does not exist.`);
			return;
		}

		return scriptExecuter({
			content: fs.readFileSync(targetPath, 'utf-8'),
			params: params,
			shell: me
		});
	},
	reload: function() {
		const me = this;

		return me.computer.load();
	},
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