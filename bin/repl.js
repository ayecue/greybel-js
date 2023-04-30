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

import repl from '../out/repl.js';
import { program } from 'commander';

const version = packageJSON.version;
let options = {};

program.version(version);
program
	.description('REPL for Greyscript.', {});

program.parse(process.argv);

(async function() {
	options = Object.assign(options, program.opts());

	await repl();
})();