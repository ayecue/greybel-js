import { ModifierType } from 'another-ansi';
import fs from 'fs/promises';
import { BuildError } from 'greybel-transpiler';
import { greyscriptMeta } from 'greyscript-meta';
import { BuildType, Transpiler } from 'greyscript-transpiler';
import isInsideContainer from 'is-inside-container';
import mkdirp from 'mkdirp';
import path from 'path';

import { createBasePath } from './build/create-base-path.js';
import { createParseResult } from './build/create-parse-result.js';
import EnvMapper from './build/env-mapper.js';
import {
  createImporter,
  parseImporterAgentType,
  parseImporterMode
} from './build/importer.js';
import { createInstaller } from './build/installer.js';
import {
  BeautifyIndentationType,
  BuildOptions,
  parseBuildOptions
} from './build/options.js';
import { TranspilerResourceProvider } from './build/resource.js';
import { ansiProvider, useColor } from './execute/output.js';

export default async function build(
  filepath: string,
  output: string,
  options: Partial<BuildOptions> = {}
): Promise<boolean> {
  const envMapper = new EnvMapper();
  const transpilerOptions: BuildOptions = parseBuildOptions(options);
  let buildType = BuildType.DEFAULT;
  let buildOptions: any = {
    isDevMode: false
  };

  envMapper.load(transpilerOptions.envFiles, transpilerOptions.envVars);

  if (transpilerOptions.uglify) {
    buildType = BuildType.UGLIFY;
  } else if (transpilerOptions.beautify) {
    buildType = BuildType.BEAUTIFY;
    buildOptions = {
      isDevMode: false,
      keepParentheses: transpilerOptions.beautifyKeepParentheses,
      indentation:
        transpilerOptions.beautifyIndentation === BeautifyIndentationType.Tab
          ? 0
          : 1,
      indentationSpaces: transpilerOptions.beautifyIndentationSpaces
    };
  }

  try {
    const target = path.resolve(filepath);
    const result = await new Transpiler({
      resourceHandler: new TranspilerResourceProvider().getHandler(),
      target,
      buildType,
      buildOptions,
      obfuscation: transpilerOptions.obfuscation,
      excludedNamespaces: [
        'params',
        ...transpilerOptions.excludedNamespaces,
        ...Array.from(
          Object.keys(
            greyscriptMeta.getTypeSignature('general').getDefinitions()
          )
        )
      ],
      disableLiteralsOptimization:
        transpilerOptions.disableLiteralsOptimization,
      disableNamespacesOptimization:
        transpilerOptions.disableNamespacesOptimization,
      environmentVariables: new Map(Object.entries(envMapper.map)),
      processImportPathCallback: (importPath: string) => {
        const relativePath = createBasePath(target, importPath);
        return path.posix.join(transpilerOptions.ingameDirectory, relativePath);
      }
    }).parse();

    let outputPath = path.resolve(output);

    if (!transpilerOptions.disableBuildFolder) {
      outputPath = path.resolve(output, './build');

      try {
        await fs.rm(outputPath, {
          recursive: true
        });
      } catch (err) {}
    }

    await mkdirp(outputPath);
    await createParseResult(target, outputPath, result);

    if (transpilerOptions.installer) {
      console.log('Creating installer.');

      await createInstaller({
        target,
        autoCompile: {
          enabled: transpilerOptions.autoCompile,
          purge: transpilerOptions.autoCompilePurge,
          binaryName: transpilerOptions.autoCompileName
        },
        ingameDirectory: transpilerOptions.ingameDirectory,
        buildPath: outputPath,
        result,
        maxChars: transpilerOptions.maxChars
      });
    }

    if (transpilerOptions.createIngame) {
      console.log('Importing files ingame.');

      const importResults = await createImporter({
        target,
        ingameDirectory: transpilerOptions.ingameDirectory,
        result,
        mode: parseImporterMode(transpilerOptions.createIngameMode),
        agentType: parseImporterAgentType(
          transpilerOptions.createIngameAgentType
        ),
        autoCompile: {
          enabled: transpilerOptions.autoCompile,
          purge: transpilerOptions.autoCompilePurge,
          binaryName: transpilerOptions.autoCompileName
        },
        postCommand: transpilerOptions.postCommand
      });
      const successfulItems = importResults.filter((item) => item.success);
      const failedItems = importResults.filter((item) => !item.success);

      if (successfulItems.length === 0) {
        console.log(
          'No files could get imported! This might be due to a new Grey Hack version or other reasons.'
        );
      } else if (failedItems.length > 0) {
        console.log(
          `Import was only partially successful. Only ${successfulItems.length} files got imported to ${transpilerOptions.ingameDirectory}!`
        );
      } else {
        console.log(
          `${successfulItems.length} files got imported to ${transpilerOptions.ingameDirectory}!`
        );
      }
    }

    if (isInsideContainer()) {
      outputPath = options.disableBuildFolder ? './' : './build';
    }

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
