const build = require('../../build');
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
			vm: me.computer.vm
		});
	},
	cd: function(params) {
		const me = this;
		const target = params.shift();

		me.computer.fileSystem.cd(target);
	},
	ls: function(params) {
		const me = this;
		const validateInput = function(input) {
			return input == '-la' || input == '-l' || input == '-a';
		};

		chalk.enabled = true;
		chalk.level = 3;

		if (
			params.length > 3 || 
			(params.length == 1 && params[0].indexOf("-") != -1 && !validateInput(params[0])) || 
			(params.length == 2 && !validateInput(params[0])) || 
			(params.length == 3 && (!validateInput(params[0]) || !validateInput(params[1])))
		) {
			console.log(chalk.green.bold('Usage: ls [opt:-l, -a, -la] [opt: path]'));
			console.log(chalk.green('It can be called without parameters.'));
			return;
		}

		const computer = me.computer;
		let folderPath = computer.fileSystem.cwd();

		if (params.length > 0 && params[params.length - 1].indexOf('-') == null) folderPath = params[params.length - 1];
			
		const folder = computer.fileSystem.getByPath(folderPath);

		if (folder == null) {
			console.log(chalk.green('ls: No such file or directory'));
		} else {
			let showHide = 0;
			if (params.length > 0 && params[0].indexOf("a") != -1) showHide = 1;

			let showDetails = 0;
			if (params.length > 0 && params[0].indexOf("l") != -1) showDetails = 1;

			const subFiles = folder.folders.concat(folder.files);
			const body = [];
			for (let subFile of subFiles) {
				if (showHide || subFile.name.indexOf('.') != 0) {
					body.push(subFile);
				}
			}
			
			console.table(body, showDetails ? ['permissions','owner','group','size','date','name'] : ['name']);
		}
	}
};

module.exports = function(target) {
	return API[target];
};