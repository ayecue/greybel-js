#!/usr/bin/env -S node --no-warnings

import { AnotherAnsiProvider, ColorType } from 'another-ansi';
import { program } from 'commander';
import pacote from 'pacote';
import semver from 'semver';

import build from '../out/build.js';
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
    .arguments('[output]')
    .description('Compiler for Greyscript.', {
      filepath: 'File to compile',
      output: 'Output directory'
    })
    .action(function (filepath, output) {
      options.filepath = filepath;
      options.output = output || '.';
    })
    .option('-id, --ingame-directory <ingameDirectory>', 'Ingame directory to where the files should be imported to')
    .option('-ev, --env-files <file...>', 'Environment variables files')
    .option('-vr, --env-vars <var...>', 'Environment variables')
    .option(
      '-en, --exclude-namespaces <namespace...>',
      'Exclude namespaces from optimization'
    )
    .option(
      '-dlo, --disable-literals-optimization',
      'Disable literals optimization'
    )
    .option(
      '-dno, --disable-namespaces-optimization',
      'Disable namespace optimization'
    )
    .option('-u, --uglify', 'Uglify your code')
    .option('-b, --beautify', 'Beautify your code')
    .option('-o, --obfuscation', 'Enable obfuscation')
    .option(
      '-i, --installer',
      'Create installer for GreyScript (Should be used if you use import_code)'
    )
    .option(
      '-ac, --auto-compile',
      'Enables autocompile within the installer or create-ingame feature'
    )
    .option(
      '-mc, --max-chars <number>',
      'Amount of characters allowed in one file before splitting when creating installer'
    )
    .option('-ci, --create-ingame', 'Create files automatically in-game')
    .option('-cia, --create-ingame-agent-type <agent-type>', 'Creation agent type: "headless" or "message-hook"')
    .option('-cim, --create-ingame-mode <mode>', 'Creation mode: "local" or "public"');

  program.parse(process.argv);

  options = Object.assign(options, program.opts());

  const success = await build(options.filepath, options.output, {
    envFiles: options.envFiles,
    envVars: options.envVars,
    uglify: options.uglify,
    beautify: options.beautify,
    obfuscation: options.obfuscation,
    disableLiteralsOptimization: options.disableLiteralsOptimization,
    disableNamespacesOptimization: options.disableNamespacesOptimization,
    excludedNamespaces: options.excludeNamespaces,
    name: options.name,
    installer: options.installer,
    autoCompile: options.autoCompile,
    maxChars: options.maxChars,
    ingameDirectory: options.ingameDirectory,
    createIngame: options.createIngame,
    createIngameAgentType: options.createIngameAgentType,
    createIngameMode: options.createIngameMode,
  });

  if (!success) {
    process.exit(1);
  }

  process.exit(0);
})();
