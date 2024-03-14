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
      filepath: 'File to compile.',
      output: 'Output directory.'
    })
    .action(function (filepath, output) {
      options.filepath = filepath;
      options.output = output || '.';
    })
    // transformer
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
      '-acp, --auto-compile-purge',
      'Specify this option if you would like all of the imported folders to be deleted after the auto-compilation process is completed regardless of any files may remaining in those folders.'
    )
    .option(
      '-acn, --auto-compile-name <name>',
      'Specify this option if you would like define a special name for the in-game binary.'
    )
    .option('-ci, --create-ingame', 'Enable transfer of your code files into Grey Hack.')
    .option('-cia, --create-ingame-agent-type <agent-type>', 'Agent type used for in-game transfer. You can choose between "headless" or "message-hook".')
    .option('-cim, --create-ingame-mode <mode>', 'Mode used for in-game transfer. You can choose between "local" or "public".')
    // output
    .option('-dbf, --disable-build-folder', 'Disable the default behaviour of putting the output into a build folder. It will instead just put it wherever you set the output destination to.');
  
  program.parse(process.argv);

  options = Object.assign(options, program.opts());

  const success = await build(options.filepath, options.output, {
    // output
    disableBuildFolder: options.disableBuildFolder,
    // transformer
    envFiles: options.envFiles,
    envVars: options.envVars,
    uglify: options.uglify,
    beautify: options.beautify,
    obfuscation: options.obfuscation,
    disableLiteralsOptimization: options.disableLiteralsOptimization,
    disableNamespacesOptimization: options.disableNamespacesOptimization,
    excludedNamespaces: options.excludeNamespaces,
    // installer + in-game importer
    installer: options.installer,
    autoCompile: options.autoCompile,
    maxChars: options.maxChars,
    ingameDirectory: options.ingameDirectory,
    createIngame: options.createIngame,
    createIngameAgentType: options.createIngameAgentType,
    createIngameMode: options.createIngameMode,
    autoCompilePurge: options.autoCompilePurge,
    autoCompileName: options.autoCompileName
  });

  if (!success) {
    process.exit(1);
  }

  process.exit(0);
})();
