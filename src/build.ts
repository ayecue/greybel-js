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
  AgentType,
  BeautifyIndentationType,
  BuildOptions,
  parseBuildOptions
} from './build/types.js';
import { ansiProvider, useColor } from './execute/output.js';
import { createBasePath } from './helper/create-base-path.js';
import { createParseResult } from './helper/create-parse-result.js';
import EnvMapper from './helper/env-mapper.js';
import { logger } from './helper/logger.js';
import { TranspilerResourceProvider } from './helper/resource.js';

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

  const sortedPaths = filePaths.slice().sort();
  let commonPath = path.dirname(sortedPaths[0]);

  for (let i = 1; i < sortedPaths.length; i++) {
    const currentPath = sortedPaths[i];

    while (currentPath.indexOf(commonPath) !== 0) {
      commonPath = path.dirname(commonPath);
      if (commonPath === '/' || commonPath === '.') {
        return null;
      }
    }
  }

  return commonPath;
}

async function transpileFile(
  filepath: string,
  buildOptions: BuildOptions,
  envMapper: EnvMapper,
  transpilerOptions: ReturnType<typeof getTranspilerOptions>
) {
  const target = path.resolve(filepath);
  const rootDir = path.dirname(target);

  return await new Transpiler({
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
  const envMapper = new EnvMapper();
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

  const rootPath = findRootPath(filepaths);

  envMapper.load(buildOptions.envFiles, buildOptions.envVars);

  try {
    const allResults = await Promise.all(
      filepaths.map((filepath) =>
        transpileFile(filepath, buildOptions, envMapper, transpilerOptions)
      )
    );
    const result = mergeTranspileResults(allResults);

    let outputPath = path.resolve(output);

    if (!buildOptions.disableBuildFolder) {
      outputPath = path.resolve(output, './build');

      try {
        await fs.rm(outputPath, {
          recursive: true
        });
      } catch (err) { }
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
          purge: buildOptions.autoCompilePurge,
          allowImport: buildOptions.allowImport
        },
        ingameDirectory: buildOptions.ingameDirectory,
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
        result,
        agentType: AgentType.C2Light,
        autoCompile: {
          enabled: buildOptions.autoCompile,
          purge: buildOptions.autoCompilePurge,
          allowImport: buildOptions.allowImport
        }
      });
    }

    logger.debug(`Build done. Available in ${outputPath}.`);
  } catch (err: any) {
    if (err instanceof BuildError) {
      logger.error(
        useColor(
          'red',
          `${ansiProvider.modify(ModifierType.Bold, 'Build error')}: ${err.message
          } at ${err.target}:${err.range?.start || 0}`
        )
      );
    } else {
      logger.error(
        useColor(
          'red',
          `${ansiProvider.modify(ModifierType.Bold, 'Unexpected error')}: ${err.message
          }\n${err.stack}`
        )
      );
    }

    return false;
  }

  return true;
}
