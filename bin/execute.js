#!/usr/bin/env node --no-warnings
import semver from 'semver';
import packageJSON from '../package.json' assert {
	type: 'json'
};

const engineVersion = packageJSON.engines.node;

if (!semver.satisfies(process.version, engineVersion)) {
  console.log(`Required node version ${engineVersion} not satisfied with current version ${process.version}.`);
  process.exit(1);
}

import execute from '../out/execute.js';
import { program } from 'commander';

const version = packageJSON.version;
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
		const inquirer = await import('@inquirer/prompts');
		const interactiveParams = await inquirer.input({
			message: 'Params:'
		});

		options.params = interactiveParams.split(' ');
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