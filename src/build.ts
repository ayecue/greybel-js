import { ModifierType } from 'another-ansi';
import fs from 'fs/promises';
import { glob } from 'glob';
import {
  BuildError,
  TranspilerOptions,
  TranspilerParseResult
} from 'greybel-transpiler';
import { greyscriptMeta } from 'greyscript-meta';
import { BuildType, Transpiler } from 'greyscript-transpiler';
import { mkdirpNative } from 'mkdirp';
import path from 'path';

import { executeImport } from './build/importer.js';
import { createInstaller } from './build/installer.js';
import {
  BeautifyIndentationType,
  BuildOptions,
  parseBuildOptions
} from './build/types.js';
import { ansiProvider, useColor } from './execute/output.js';
import { configurationManager } from './helper/configuration-manager.js';
import {
  createBasePath,
  getMatchingSegments
} from './helper/create-base-path.js';
import { createParseResult } from './helper/create-parse-result.js';
import { EnvironmentVariablesManager } from './helper/env-mapper.js';
import { logger } from './helper/logger.js';
import { TranspilerResourceProvider } from './helper/resource.js';
import { VersionManager } from './helper/version-manager.js';
import { randomString } from './helper/random-string.js';

function getTranspilerOptions(options: BuildOptions) {
  let buildType = BuildType.DEFAULT;
  let buildOptions: TranspilerOptions['buildOptions'] = {
    isDevMode: false
  };

  if (options.uglify) {
    buildType = BuildType.UGLIFY;
    buildOptions = {
      disableLiteralsOptimization: options.disableLiteralsOptimization,
      disableNamespacesOptimization: options.disableNamespacesOptimization
    };
  } else if (options.beautify) {
    buildType = BuildType.BEAUTIFY;
    buildOptions = {
      isDevMode: false,
      keepParentheses: options.beautifyKeepParentheses,
      indentation:
        options.beautifyIndentation === BeautifyIndentationType.Tab ? 0 : 1,
      indentationSpaces: options.beautifyIndentationSpaces
    };
  }

  return {
    buildType,
    buildOptions
  };
}

function findRootPath(filePaths: string[]): string | null {
  if (filePaths.length === 0) {
    return null;
  }

  let currentPath = path.dirname(filePaths[0]);

  for (let i = 1; i < filePaths.length; i++) {
    currentPath = getMatchingSegments(currentPath, filePaths[i]).join(path.sep);
  }

  return currentPath;
}

async function transpileFile(
  filepath: string,
  buildOptions: BuildOptions,
  envMapper: EnvironmentVariablesManager,
  transpilerOptions: ReturnType<typeof getTranspilerOptions>
) {
  const target = path.resolve(filepath);
  const rootDir = path.dirname(target);
  const result = await new Transpiler({
    resourceHandler: new TranspilerResourceProvider().getHandler(),
    target,
    buildType: transpilerOptions.buildType,
    buildOptions: transpilerOptions.buildOptions,
    obfuscation: buildOptions.obfuscation,
    excludedNamespaces: [
      'params',
      ...buildOptions.excludedNamespaces,
      ...Array.from(
        Object.keys(greyscriptMeta.getTypeSignature('general').getDefinitions())
      )
    ],
    environmentVariables: envMapper.toMap(true),
    processImportPathCallback: (importPath: string) => {
      const relativePath = createBasePath(rootDir, importPath);
      return path.posix.join(buildOptions.ingameDirectory, relativePath);
    }
  }).parse();

  return result;
}

function mergeTranspileResults(
  results: TranspilerParseResult[]
): TranspilerParseResult {
  const merged: TranspilerParseResult = {};

  for (const result of results) {
    Object.assign(merged, result);
  }

  return merged;
}

export default async function build(
  filepath: string,
  output: string,
  options: Partial<BuildOptions> = {}
): Promise<boolean> {
  const envMapper = new EnvironmentVariablesManager();
  const buildOptions: BuildOptions = parseBuildOptions(options);
  const transpilerOptions = getTranspilerOptions(buildOptions);
  const filepaths = await glob(filepath, {
    absolute: true,
    nodir: true
  });

  if (filepaths.length === 0) {
    logger.warn(useColor('yellow', 'No files found!'));
    return false;
  }

  if (options.fileExtensions) {
    configurationManager.set('fileExtensions', options.fileExtensions);
  }

  const rootPath = findRootPath(filepaths);

  envMapper.load(buildOptions.envFiles, buildOptions.envVars);

  try {
    let allResults: TranspilerParseResult[];
    const resourceDirectory = path.posix.join(buildOptions.ingameDirectory, randomString(5));
    const fileImportRootPath = buildOptions.autoCompile ? resourceDirectory : buildOptions.ingameDirectory;

    if (
      buildOptions.outputFilename != null &&
      buildOptions.outputFilename != ''
    ) {
      if (filepaths.length > 1) {
        logger.warn(
          useColor(
            'yellow',
            'Cannot use output filename option when targeting multiple files!'
          )
        );
        return false;
      }

      const mainFilepath = filepaths[0];
      const outFilepath = path.join(
        path.dirname(mainFilepath),
        buildOptions.outputFilename
      );
      const mainResult = await transpileFile(
        mainFilepath,
        {
          ...buildOptions,
          ingameDirectory: fileImportRootPath
        },
        envMapper,
        transpilerOptions
      );

      // Remove the main file from the result and add the output filename
      const mainContent = mainResult[mainFilepath];
      delete mainResult[mainFilepath];
      mainResult[outFilepath] = mainContent;
      filepaths[0] = outFilepath;

      allResults = [mainResult];
    } else {
      allResults = await Promise.all(
        filepaths.map((filepath) =>
          transpileFile(filepath, {
          ...buildOptions,
          ingameDirectory: fileImportRootPath
          }, envMapper, transpilerOptions)
        )
      );
    }

    const result = mergeTranspileResults(allResults);

    let outputPath = path.resolve(output);

    if (!buildOptions.disableBuildFolder) {
      outputPath = path.resolve(output, './build');

      try {
        await fs.rm(outputPath, {
          recursive: true
        });
      } catch (err) {}
    }

    await mkdirpNative(outputPath);
    await createParseResult(rootPath, outputPath, result);

    if (buildOptions.installer) {
      logger.debug('Creating installer.');

      await createInstaller({
        rootDir: rootPath,
        rootPaths: filepaths,
        autoCompile: {
          enabled: buildOptions.autoCompile,
          allowImport: buildOptions.allowImport
        },
        ingameDirectory: buildOptions.ingameDirectory,
        resourceDirectory,
        buildPath: outputPath,
        result,
        maxChars: buildOptions.maxChars
      });
    }

    if (buildOptions.createIngame) {
      logger.debug('Importing files ingame.');

      await executeImport({
        rootDir: rootPath,
        rootPaths: filepaths,
        ingameDirectory: buildOptions.ingameDirectory,
        resourceDirectory,
        result,
        port: buildOptions.port,
        autoCompile: {
          enabled: buildOptions.autoCompile,
          allowImport: buildOptions.allowImport
        }
      });

      await VersionManager.triggerContextAgentHealthcheck();
    }

    logger.debug(`Build done. Available in ${outputPath}.`);
  } catch (err: any) {
    if (err instanceof BuildError) {
      logger.error(
        useColor(
          'red',
          `${ansiProvider.modify(ModifierType.Bold, 'Build error')}: ${
            err.message
          } at ${err.target}:${err.range?.start || 0}`
        )
      );
    } else {
      logger.error(
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
