#!/usr/bin/env -S node --no-warnings --no-deprecation

import { AnotherAnsiProvider, ColorType } from 'another-ansi';
import { program } from 'commander';
import pacote from 'pacote';
import semver from 'semver';
import open from 'open';
import { createRequire } from 'node:module';

import execute from '../out/execute.js';
import build from '../out/build.js';
import repl from '../out/repl.js';
import upload from '../out/upload.js';
import { logger } from '../out/helper/logger.js';

// revisit once import type { 'json' } is supported by lts
const require = createRequire(import.meta.url);
const packageJSON = require('../package.json');

const ansiProvider = new AnotherAnsiProvider();
const engineVersion = packageJSON.engines.node;
let options = {};

if (!semver.satisfies(process.version, engineVersion)) {
  logger.debug(
    ansiProvider.color(
      ColorType.Yellow,
      `Required node version ${engineVersion} not satisfied with current version ${process.version}.`
    )
  );
  process.exit(1);
}

async function checkForLatestVersion() {
  const version = packageJSON.version;
  const latestManifest = await pacote.manifest(packageJSON.name, {
    fullMetadata: false
  });

  if (latestManifest.version !== version) {
    logger.debug(
      ansiProvider.color(
        ColorType.Yellow,
        `New version of ${packageJSON.name} is available ${latestManifest.version}.`
      )
    );
  }
}

function attachBuildCommand() {
  const command = program.command('build');

  command
    .arguments('<filepath>')
    .arguments('[output]')
    .description('Compiler for Greyscript.', {
      filepath: 'File to compile.',
      output: 'Output directory.'
    })
    .action(function (filepath, output, buildOptions) {
      options.action = 'build';
      options.filepath = filepath;
      options.output = output || '.';
      Object.assign(options, buildOptions);
    })
    // transformer
    .option('-fe, --file-extensions <extension...>', 'Define allowed file extensions.')
    .option('-ev, --env-files <file...>', 'Specifiy environment variables file.')
    .option('-vr, --env-vars <var...>', 'Specifiy environment variable definition.')
    .option(
      '-en, --exclude-namespaces <namespace...>',
      'Exclude namespaces from optimization. This option is only used in combination with uglifying.'
    )
    .option(
      '-dlo, --disable-literals-optimization',
      'Disable literals optimization. This option is only used in combination with uglifying.'
    )
    .option(
      '-dno, --disable-namespaces-optimization',
      'Disable namespace optimization. This option is only used in combination with uglifying.'
    )
    .option('-u, --uglify', 'Minify your code.')
    .option('-b, --beautify', 'Beautify your code.')
    .option('-bkp, --beautify-keep-parentheses', 'Always keep the parentheses.')
    .option('-bi, --beautify-indentation <type>', 'Tab or whitespace. What should be used for indentation?')
    .option('-bis, --beautify-indentation-spaces <number>', 'Define the amount of whitespaces when using whitespaces as indentation.')
    .option('-o, --obfuscation', 'Allows the namespace optimization to use a wider range of characters in order to safe more space.')
    // installer + in-game importer
    .option('-id, --ingame-directory <ingameDirectory>', 'In-game directory target path.')
    .option(
      '-i, --installer',
      'Create installer for GreyScript. Only use this option when there is at least one import_code in place.'
    )
    .option(
      '-mc, --max-chars <number>',
      'Max amount of characters allowed per file. Installer files will be split depending on the amount defined in this option. By default the maximum is 160k chars.'
    )
    .option(
      '-ac, --auto-compile',
      'Enables auto-compile within the installer or create-ingame feature. This option will also delete all files in-game after building.'
    )
    .option(
      '-ai, --allow-import',
      'Enables allowImport on auto-compile.'
    )
    .option(
      '-acp, --auto-compile-purge',
      'Specify this option if you would like all of the imported folders to be deleted after the auto-compilation process is completed regardless of any files may remaining in those folders.'
    )
    .option('-ci, --create-ingame', 'Enable transfer of your code files into Grey Hack.')
    .option('-pt, --port <port>', 'Set connection port for message-hook. (only relevant when using --create-ingame)')
    // output
    .option('-dbf, --disable-build-folder', 'Disable the default behaviour of putting the output into a build folder. It will instead just put it wherever you set the output destination to.')
    .option('-si, --silent', 'Silences any uncessary noise.')
    .option('-of, --outputFilename <name>', 'Specify the name of the main output file.');
}

async function runBuildCommand() {
  const success = await build(options.filepath, options.output, {
    // output
    disableBuildFolder: options.disableBuildFolder,
    outputFilename: options.outputFilename,
    // transformer
    fileExtensions: options.fileExtensions,
    envFiles: options.envFiles,
    envVars: options.envVars,
    uglify: options.uglify,
    beautify: options.beautify,
    beautifyKeepParentheses: options.beautifyKeepParentheses,
    beautifyIndentation: options.beautifyIndentation,
    beautifyIndentationSpaces: options.beautifyIndentationSpaces ? parseInt(options.beautifyIndentationSpaces) : null,
    obfuscation: options.obfuscation,
    disableLiteralsOptimization: options.disableLiteralsOptimization,
    disableNamespacesOptimization: options.disableNamespacesOptimization,
    excludedNamespaces: options.excludeNamespaces,
    // installer + in-game importer
    installer: options.installer,
    autoCompile: options.autoCompile,
    allowImport: options.allowImport,
    maxChars: options.maxChars ? parseInt(options.maxChars) : null,
    ingameDirectory: options.ingameDirectory,
    createIngame: options.createIngame,
    autoCompilePurge: options.autoCompilePurge,
    port: options.port ? Number(options.port) : null,
  });

  if (!success) {
    process.exit(1);
  }

  process.exit(0);
}

function attachImportCommand() {
  const command = program.command('import');

  command
    .arguments('<targetpath>')
    .description('File import for Grey Hack.', {
      targetpath: 'File to import.'
    })
    .action(function (targetpath, uploadOptions) {
      options.action = 'import';
      options.targetpath = targetpath;
      Object.assign(options, uploadOptions);
    })
    .option('-id, --ingame-directory <ingameDirectory>', 'In-game directory target path.')
    .option('-pt, --port <port>', 'Set connection port for message-hook.');
}

async function runImportCommand() {
  const success = await upload(options.targetpath, {
    ingameDirectory: options.ingameDirectory,
    port: options.port ? Number(options.port) : null,
  });

  if (!success) {
    process.exit(1);
  }

  process.exit(0);
}

function attachExecuteCommand() {
  const command = program.command('execute');

  command
    .arguments('<filepath>')
    .description('Interpreter for Greyscript.', {
      filepath: 'File to run.'
    })
    .action(function (filepath, executeOptions) {
      options.action = 'execute';
      options.filepath = filepath;
      Object.assign(options, executeOptions);
    })
    .option('-p, --params <params...>', 'Defines params used in script execution.')
    .option('-i, --interactive', 'Enter params in interactive mode instead of arguments.')
    .option('-d, --debug', 'Enable debug mode which will cause to stop at debugger statements.')
    .option('-s, --seed <seed>', 'Define seed value which is used to generate entities. (only relevant when using Mock environment)')
    .option('-ev, --env-files <file...>', 'Specifiy environment variables file.')
    .option('-vr, --env-vars <var...>', 'Specifiy environment variable definition.')
    .option('-si, --silent', 'Silences any uncessary noise.')
    .option('-et, --env-type <type>', 'Set interpreter environment. (Mock, In-Game)')
    .option('-pt, --port <port>', 'Set connection port for message-hook. (only relevant when using In-Game environment)')
    .option('-pg, --programName <name>', 'Set program name used in runtime. (only relevant when using In-Game environment)')
    .option('-fe, --file-extensions <extension...>', 'Define allowed file extensions.');
}

async function runExecuteCommand() {
  const success = await execute(options.filepath, {
    fileExtensions: options.fileExtensions,
    debugMode: options.debug,
    params: options.params,
    seed: options.seed,
    envFiles: options.envFiles,
    envVars: options.envVars,
    envType: options.envType ?? 'Mock',
    port: options.port ? Number(options.port) : null,
    programName: options.programName,
  });

  if (!success) {
    process.exit(1);
  }

  process.exit(0);
}

function attachREPLCommand() {
  const command = program.command('repl');

  command
    .description('REPL for Greyscript.', {})
    .action(function () {
      options.action = 'repl';
    });
}

async function runREPLCommand() {
  await repl();
  process.exit(0);
}

function attachUICommand() {
  const command = program.command('ui');

  command
    .description('Web UI.')
    .action(function () {
      options.action = 'ui';
    });
}

async function runUICommand() {
  const indexFile = new URL('../out/index.html', import.meta.url);
  await open(indexFile.toString());
  process.exit(0);
}

async function main() {
  const version = packageJSON.version;

  program.version(version);

  attachBuildCommand();
  attachImportCommand();
  attachExecuteCommand();
  attachREPLCommand();
  attachUICommand();

  program.parse(process.argv);

  if (options.silent) {
    // only allows info and error logs
    logger.setLogLevel('info');
  } else {
    checkForLatestVersion().catch(console.error);
  }

  switch (options.action) {
    case 'build':
      await runBuildCommand();
      return;
    case 'import':
      await runImportCommand();
      return;
    case 'execute':
      await runExecuteCommand();
      return;
    case 'repl':
      await runREPLCommand();
      return;
    case 'ui':
      await runUICommand();
      return;
    default:
      console.error('Unknown action!');
      process.exit(1);
  }
}

main();