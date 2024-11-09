import GreybelAgentPkg from 'greybel-agent';
import { TranspilerParseResult } from 'greybel-transpiler';
import storage from 'node-persist';
import path from 'path';

import { generateAutoCompileCode } from '../helper/auto-compile-helper.js';
import { createBasePath } from '../helper/create-base-path.js';
import { logger } from '../helper/logger.js';
import { wait } from '../helper/wait.js';
import { AgentType, ErrorResponseMessage, ImporterMode } from './types.js';
const { GreybelC2Agent, GreybelC2LightAgent } = GreybelAgentPkg.default;

const IMPORTER_MODE_MAP = {
  [ImporterMode.Local]: 2,
  [ImporterMode.Public]: 0
};

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
  mode: ImporterMode;
  ingameDirectory: string;
  agentType: AgentType;
  result: TranspilerParseResult;
  autoCompile: {
    enabled: boolean;
    purge: boolean;
    binaryName: string | null;
  };
  postCommand: string;
}

class Importer {
  private importRefs: Map<string, ImportItem>;
  private agentType: AgentType;
  private target: string;
  private ingameDirectory: string;
  private mode: ImporterMode;
  private autoCompile: {
    enabled: boolean;
    purge: boolean;
    binaryName: string | null;
  };

  private postCommand: string;

  constructor(options: ImporterOptions) {
    this.target = options.target;
    this.ingameDirectory = options.ingameDirectory.trim().replace(/\/$/i, '');
    this.importRefs = this.createImportList(options.target, options.result);
    this.agentType = options.agentType;
    this.mode = options.mode;
    this.autoCompile = options.autoCompile;
    this.postCommand = options.postCommand;
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
        await storage.init();

        return new GreybelC2Agent(
          {
            connectionType: IMPORTER_MODE_MAP[this.mode],
            refreshToken: await storage.getItem('greybel.steam.refreshToken'),
            onSteamRefreshToken: (code) =>
              storage.setItem('greybel.steam.refreshToken', code)
          },
          [125, 150]
        );
      }
      case AgentType.C2Light: {
        return new GreybelC2LightAgent([125, 150]);
      }
    }
  }

  async import(): Promise<ImportResult[]> {
    if (!Object.prototype.hasOwnProperty.call(IMPORTER_MODE_MAP, this.mode)) {
      throw new Error('Unknown import mode.');
    }

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
          binaryName: this.autoCompile.binaryName
        }),
        ({ output }) => logger.debug(output)
      );
    }

    if (this.postCommand !== '') {
      if (this.agentType === AgentType.C2Light) {
        agent.tryToRun(null, 'cd ' + this.ingameDirectory, ({ output }) =>
          logger.debug(output)
        );
        await wait(500);
        agent.tryToRun(null, this.postCommand, ({ output }) =>
          logger.debug(output)
        );
        await wait(500);
        agent.terminal = null;
      } else {
        logger.warn(
          `Warning: Post command can only be executed when agent type is ${AgentType.C2Light}`
        );
      }
    }

    await agent.dispose();

    return results;
  }
}

export const parseImporterAgentType = (agentType: string): AgentType => {
  switch (agentType) {
    case AgentType.C2Light:
      return AgentType.C2Light;
    default:
      return AgentType.C2;
  }
};

export const parseImporterMode = (mode: string): ImporterMode => {
  switch (mode) {
    case ImporterMode.Public:
      return ImporterMode.Public;
    default:
      return ImporterMode.Local;
  }
};

export const createImporter = async (
  options: ImporterOptions
): Promise<ImportResult[]> => {
  const installer = new Importer(options);
  return await installer.import();
};
