import GreybelAgentPkg from 'greybel-agent';
import { TranspilerParseResult } from 'greybel-transpiler';
import path from 'path';

import { generateAutoCompileCode } from '../helper/auto-compile-helper.js';
import { createBasePath } from '../helper/create-base-path.js';
import { logger } from '../helper/logger.js';
import { AgentType, ErrorResponseMessage } from './types.js';
const { GreybelC2LightAgent } = GreybelAgentPkg.default;

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
  target: string;
  ingameDirectory: string;
  agentType: AgentType;
  result: TranspilerParseResult;
  autoCompile: {
    enabled: boolean;
    purge: boolean;
    binaryName: string | null;
    allowImport: boolean;
  };
}

class Importer {
  private importRefs: Map<string, ImportItem>;
  private agentType: AgentType;
  private target: string;
  private ingameDirectory: string;
  private autoCompile: {
    enabled: boolean;
    purge: boolean;
    binaryName: string | null;
    allowImport: boolean;
  };

  constructor(options: ImporterOptions) {
    this.target = options.target;
    this.ingameDirectory = options.ingameDirectory.trim().replace(/\/$/i, '');
    this.importRefs = this.createImportList(options.target, options.result);
    this.agentType = options.agentType;
    this.autoCompile = options.autoCompile;
  }

  private createImportList(
    rootTarget: string,
    parseResult: TranspilerParseResult
  ): Map<string, ImportItem> {
    return Object.entries(parseResult).reduce<Map<string, ImportItem>>(
      (result, [target, code]) => {
        const ingameFilepath = createBasePath(rootTarget, target, '');

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
    switch (this.agentType) {
      case AgentType.C2: {
        throw new Error('Headless mode is no longer supported.');
      }
      case AgentType.C2Light: {
        return new GreybelC2LightAgent([125, 150]);
      }
    }
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
      const rootRef = this.importRefs.get(this.target);

      await agent.tryToEvaluate(
        generateAutoCompileCode({
          rootDirectory: this.ingameDirectory,
          rootFilePath: rootRef.ingameFilepath,
          importPaths: Array.from(this.importRefs.values()).map(
            (it) => it.ingameFilepath
          ),
          purge: this.autoCompile.purge,
          binaryName: this.autoCompile.binaryName,
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

const reportFailure = (
  failedItems: ImportResultFailure[],
  agentType: AgentType
): void => {
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
    reportFailure(failedItems, options.agentType);
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
