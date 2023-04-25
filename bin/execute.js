#!/usr/bin/env node
const inquirer = require('inquirer');
const semver = require('semver');
const package = require('../package.json');

const engineVersion = package.engines.node;

if (!semver.satisfies(process.version, engineVersion)) {
  console.log(`Required node version ${engineVersion} not satisfied with current version ${process.version}.`);
  process.exit(1);
}

const execute = require('../out/execute').default;
const program = require('commander').program;
const version = package.version;
let options = {};

program.version(version);
program
	.arguments('<filepath>')
	.description('Interpreter for Greyscript.', {
		filepath: 'File to run'
	})
	.action(function (filepath, output) {
		options.filepath = filepath;
	})
	.option('-p, --params <params...>', 'Execution parameters')
	.option('-i, --interactive', 'Interactive parameters')
	.option('-s, --seed <seed>', 'Seed parameter')
	.option('-ev, --env-files <file...>', 'Environment variables files')
	.option('-vr, --env-vars <var...>', 'Environment variables');

program.parse(process.argv);

(async function() {
	options = Object.assign(options, program.opts());

	if (options.interactive) {
		options.params = await inquirer
			.prompt({
				name: 'default',
				message: 'Params:',
				type: 'input',
				loop: false
			})
			.then((inputMap) => {
				return inputMap.default.split(' ');
			})
			.catch((err) => {
				throw err;
			});
	}

	const success = await execute(options.filepath, {
		params: options.params,
		seed: options.seed,
		envFiles: options.envFiles,
		envVars: options.envVars,
	});

	if (!success) {
		process.exit(1);
	}
})();