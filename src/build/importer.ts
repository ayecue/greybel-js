import { TranspilerParseResult } from 'greybel-transpiler';
import GreyHackMessageHookClientPkg from 'greyhack-message-hook-client';
import path from 'path';

import { generateAutoCompileCode } from '../helper/auto-compile-helper.js';
import { createBasePath } from '../helper/create-base-path.js';
import { logger } from '../helper/logger.js';
import { ErrorResponseMessage } from './types.js';
const { GameAgent: Agent } = GreyHackMessageHookClientPkg;

type ImportItem = {
  ingameFilepath: string;
  content: string;
};

export type ImportResultSuccess = {
  path: string;
  success: true;
};

export type ImportResultFailure = {
  path: string;
  success: false;
  reason: string;
};

export type ImportResult = ImportResultSuccess | ImportResultFailure;

export interface ImporterOptions {
  rootDir: string;
  ingameDirectory: string;
  rootPaths: string[];
  result: TranspilerParseResult;
  port: number;
  autoCompile: {
    enabled: boolean;
    purge: boolean;
    allowImport: boolean;
  };
}

class Importer {
  private importRefs: Map<string, ImportItem>;
  private rootDir: string;
  private rootPaths: string[];
  private ingameDirectory: string;
  private port: number;
  private autoCompile: {
    enabled: boolean;
    purge: boolean;
    allowImport: boolean;
  };

  constructor(options: ImporterOptions) {
    this.rootDir = options.rootDir;
    this.rootPaths = options.rootPaths;
    this.port = options.port;
    this.ingameDirectory = options.ingameDirectory.trim().replace(/\/$/i, '');
    this.importRefs = this.createImportList(options.rootDir, options.result);
    this.autoCompile = options.autoCompile;
  }

  private createImportList(
    rootDir: string,
    parseResult: TranspilerParseResult
  ): Map<string, ImportItem> {
    return Object.entries(parseResult).reduce<Map<string, ImportItem>>(
      (result, [target, code]) => {
        const ingameFilepath = createBasePath(rootDir, target, '');

        result.set(target, {
          ingameFilepath,
          content: code
        });

        return result;
      },
      new Map()
    );
  }

  async createAgent(): Promise<any> {
    return new Agent(
      {
        warn: () => {},
        error: () => {},
        info: () => {},
        debug: () => {}
      },
      this.port
    );
  }

  async import(): Promise<ImportResult[]> {
    const agent = await this.createAgent();
    const results: ImportResult[] = [];

    for (const item of this.importRefs.values()) {
      const response = await agent.tryToCreateFile(
        this.ingameDirectory + path.posix.dirname(item.ingameFilepath),
        path.basename(item.ingameFilepath),
        item.content
      );

      if (response.success) {
        logger.debug(`Imported ${item.ingameFilepath} successful`);
        results.push({ path: item.ingameFilepath, success: true });
      } else {
        results.push({
          path: item.ingameFilepath,
          success: false,
          reason: response.message
        });

        switch (response.message) {
          case ErrorResponseMessage.OutOfRam:
          case ErrorResponseMessage.DesktopUI:
          case ErrorResponseMessage.CanOnlyRunOnComputer:
          case ErrorResponseMessage.CannotBeExecutedRemotely:
          case ErrorResponseMessage.CannotLaunch:
          case ErrorResponseMessage.NotAttached:
          case ErrorResponseMessage.DeviceNotFound:
          case ErrorResponseMessage.NoInternet:
          case ErrorResponseMessage.InvalidCommand: {
            logger.debug(`Importing got aborted due to ${response.message}`);
            return results;
          }
          default: {
            logger.error(
              `Importing of ${item.ingameFilepath} failed due to ${response.message}`
            );
          }
        }
      }
    }

    if (this.autoCompile.enabled) {
      const rootImports = this.rootPaths.map((it) => {
        return this.importRefs.get(it);
      });

      await agent.tryToEvaluate(
        generateAutoCompileCode({
          rootDirectory: this.ingameDirectory,
          rootFilePaths: rootImports.map((it) => it.ingameFilepath),
          importPaths: Array.from(this.importRefs.values()).map(
            (it) => it.ingameFilepath
          ),
          purge: this.autoCompile.purge,
          allowImport: this.autoCompile.allowImport
        }),
        ({ output }) => logger.debug(output)
      );
    }

    await agent.dispose();

    return results;
  }
}

enum CommonImportErrorReason {
  NoAvailableSocket = 'There is no available socket!',
  NewGameVersion = 'A new game update is available.'
}

const reportFailure = (failedItems: ImportResultFailure[]): void => {
  const uniqueErrorReasons = new Set(failedItems.map((it) => it.reason));

  if (uniqueErrorReasons.size === 1) {
    const singularErrorReason = failedItems[0].reason;

    if (
      singularErrorReason.indexOf(CommonImportErrorReason.NoAvailableSocket) !==
      -1
    ) {
      logger.debug(`File import failed

The issue appears to be due to the lack of an available socket. This could suggest that the BepInEx plugin is not installed correctly, or the game is not running. Double-check the plugin installation and ensure the game is running.

For detailed troubleshooting steps, please consult the documentation: https://github.com/ayecue/greybel-js?tab=readme-ov-file#message-hook.`);
      return;
    } else if (
      singularErrorReason.indexOf(CommonImportErrorReason.NewGameVersion) !== -1
    ) {
      logger.debug(`File import failed

It seems that the game has received an update. This can sometimes cause issues with the import process. Please wait for the Greybel developers to update the package and try again later.`);
      return;
    }
    logger.debug(`File import failed

The reason seems to be unknown for now. Please either join the discord or create an issue on GitHub.`);

    return;
  }

  logger.debug(`File import failed!

The reason seems to be unknown for now. Please either join the discord or create an issue on GitHub.`);
};

export const executeImport = async (
  options: ImporterOptions
): Promise<boolean> => {
  const importer = new Importer(options);
  const results = await importer.import();

  const successfulItems = results.filter(
    (item) => item.success
  ) as ImportResultSuccess[];
  const failedItems = results.filter(
    (item) => !item.success
  ) as ImportResultFailure[];

  if (successfulItems.length === 0) {
    reportFailure(failedItems);
    return false;
  } else if (failedItems.length > 0) {
    logger.debug(
      `Import was only partially successful. Only ${successfulItems.length} files got imported to ${options.ingameDirectory}!`
    );
    return false;
  }

  logger.debug(
    `${successfulItems.length} files got imported to ${options.ingameDirectory}!`
  );

  return true;
};
