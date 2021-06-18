const scriptExecuter = require('../script-executer');
const chalk = require('chalk');
const path = require('path');
const fs = require('fs');

const API = {
	run: function(params) {
		const me = this;
		const target = params.shift();
		const cwd = process.cwd();
		const targetPath = path.resolve(target);

		return scriptExecuter({
			filename: targetPath,
			params: params,
			shell: me
		});
	},
	cd: function(params) {
		const me = this;
		const target = params.shift();

		me.cd(target);
	}
};

module.exports = function(target) {
	return API[target];
};