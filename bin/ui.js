#!/usr/bin/env node
import semver from 'semver';
import packageJSON from '../package.json' assert {
	type: 'json'
};

const engineVersion = packageJSON.engines.node;

if (!semver.satisfies(process.version, engineVersion)) {
	console.log(`Required node version ${engineVersion} not satisfied with current version ${process.version}.`);
	process.exit(1);
}

import { program } from 'commander';
import open from 'open';

const version = packageJSON.version;

let options = {};

program.version(version);
program
	.description('Web UI.');

program.parse(process.argv);

options = Object.assign(options, program.opts());

const indexFile = new URL('../out/index.html', import.meta.url);

open(indexFile.toString());