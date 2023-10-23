#!/usr/bin/env node --no-warnings
import { AnotherAnsiProvider, ColorType } from 'another-ansi';
import { program } from 'commander';
import pacote from 'pacote';
import semver from 'semver';

import execute from '../out/execute.js';
import packageJSON from '../package.json' assert { type: 'json' };

const ansiProvider = new AnotherAnsiProvider();
const engineVersion = packageJSON.engines.node;

if (!semver.satisfies(process.version, engineVersion)) {
  console.log(
    ansiProvider.color(
      ColorType.Yellow,
      `Required node version ${engineVersion} not satisfied with current version ${process.version}.`
    )
  );
  process.exit(1);
}

(async function () {
  const version = packageJSON.version;
  const latestManifest = await pacote.manifest(packageJSON.name, {
    fullMetadata: false
  });

  if (latestManifest.version !== version) {
    console.warn(
      ansiProvider.color(
        ColorType.Yellow,
        `New version of ${packageJSON.name} is available ${latestManifest.version}.`
      )
    );
  }

  let options = {};

  program.version(version);
  program
    .arguments('<filepath>')
    .description('Interpreter for Greyscript.', {
      filepath: 'File to run'
    })
    .action(function (filepath, _output) {
      options.filepath = filepath;
    })
    .option('-p, --params <params...>', 'Execution parameters')
    .option('-i, --interactive', 'Interactive parameters')
    .option('-s, --seed <seed>', 'Seed parameter')
    .option('-ev, --env-files <file...>', 'Environment variables files')
    .option('-vr, --env-vars <var...>', 'Environment variables');

  program.parse(process.argv);

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
    envVars: options.envVars
  });

  if (!success) {
    process.exit(1);
  }

  process.exit(0);
})();
