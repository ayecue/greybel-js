import { ModifierType } from 'another-ansi';
import fs from 'fs/promises';
import { BuildError, BuildType, Transpiler } from 'greybel-transpiler';
import isInsideContainer from 'is-inside-container';
import mkdirp from 'mkdirp';
import path from 'path';

import { createBasePath } from './build/create-base-path.js';
import { createParseResult } from './build/create-parse-result.js';
import EnvMapper from './build/env-mapper.js';
import { createImporter } from './build/importer.js';
import { createInstaller } from './build/installer.js';
import { ansiProvider, useColor } from './execute/output.js';

export interface BuildOptions {
  uglify: boolean;
  beautify: boolean;
  obfuscation: boolean;
  installer: boolean;
  autoCompile: boolean;
  excludedNamespaces: string[];
  disableLiteralsOptimization: boolean;
  disableNamespacesOptimization: boolean;
  envFiles: string[];
  envVars: string[];
  maxChars: number;
  ingameDirectory: string;
  createIngame: boolean;
  createIngameMode: string;
}

export default async function build(
  filepath: string,
  output: string,
  options: Partial<BuildOptions> = {}
): Promise<boolean> {
  const envMapper = new EnvMapper();
  const buildOptions: BuildOptions = {
    uglify: options.uglify || false,
    beautify: options.beautify || false,
    obfuscation: options.obfuscation || false,
    installer: options.installer || false,
    autoCompile: options.autoCompile || false,
    excludedNamespaces: options.excludedNamespaces || [],
    disableLiteralsOptimization: options.disableLiteralsOptimization || false,
    disableNamespacesOptimization:
      options.disableNamespacesOptimization || false,
    maxChars: options.maxChars || 160000,
    envFiles: options.envFiles || [],
    envVars: options.envVars || [],
    ingameDirectory: options.ingameDirectory || '/root/',
    createIngame: options.createIngame || false,
    createIngameMode: options.createIngameMode || 'local'
  };
  let buildType = BuildType.DEFAULT;

  envMapper.load(buildOptions.envFiles, buildOptions.envVars);

  if (buildOptions.uglify) {
    buildType = BuildType.UGLIFY;
  } else if (buildOptions.beautify) {
    buildType = BuildType.BEAUTIFY;
  }

  try {
    const target = path.resolve(filepath);
    const result = await new Transpiler({
      target,
      buildType,
      obfuscation: buildOptions.obfuscation,
      excludedNamespaces: buildOptions.excludedNamespaces,
      disableLiteralsOptimization: buildOptions.disableLiteralsOptimization,
      disableNamespacesOptimization: buildOptions.disableNamespacesOptimization,
      environmentVariables: new Map(Object.entries(envMapper.map)),
      processImportPathCallback: (importPath: string) => {
        const relativePath = createBasePath(target, importPath);
        return path.posix.join(buildOptions.ingameDirectory, relativePath);
      }
    }).parse();

    const buildPath = path.resolve(output, './build');

    try {
      await fs.rm(buildPath, {
        recursive: true
      });
    } catch (err) {}

    await mkdirp(buildPath);
    await createParseResult(target, buildPath, result);

    if (buildOptions.installer) {
      console.log('Creating installer.');
      await createInstaller({
        target,
        autoCompile: buildOptions.autoCompile,
        ingameDirectory: buildOptions.ingameDirectory.replace(/\/$/i, ''),
        buildPath,
        result,
        maxChars: buildOptions.maxChars
      });
    }

    if (buildOptions.createIngame) {
      console.log('Importing files ingame.');

      const importResults = await createImporter({
        target,
        ingameDirectory: buildOptions.ingameDirectory.replace(/\/$/i, ''),
        result,
        mode: buildOptions.createIngameMode
      });
      const successfulItems = importResults.filter((item) => item.success);
      const failedItems = importResults.filter((item) => !item.success);

      if (successfulItems.length === 0) {
        console.log(
          'No files could get imported! This might be due to a new Grey Hack version or other reasons.'
        );
      } else if (failedItems.length > 0) {
        console.log(
          `Import was only partially successful. Only ${successfulItems.length} files got imported to ${buildOptions.ingameDirectory}!`
        );
      } else {
        console.log(
          `${successfulItems.length} files got imported to ${buildOptions.ingameDirectory}!`
        );
      }
    }

    const outputPath = isInsideContainer() ? './build' : buildPath;
    console.log(`Build done. Available in ${outputPath}.`);
  } catch (err: any) {
    if (err instanceof BuildError) {
      console.error(
        useColor(
          'red',
          `${ansiProvider.modify(ModifierType.Bold, 'Build error')}: ${
            err.message
          } at ${err.target}:${err.range?.start || 0}`
        )
      );
    } else {
      console.error(
        useColor(
          'red',
          `${ansiProvider.modify(ModifierType.Bold, 'Unexpected error')}: ${
            err.message
          }\n${err.stack}`
        )
      );
    }

    return false;
  }

  return true;
}
