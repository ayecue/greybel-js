import GreybelAgentPkg from 'greybel-agent';
import { TranspilerParseResult } from 'greybel-transpiler';
import storage from 'node-persist';
import path from 'path';

import { generateAutoCompileCode } from './auto-compile-helper.js';
import { createBasePath } from './create-base-path.js';
const { GreybelC2Agent, GreybelC2LightAgent } = GreybelAgentPkg.default;

export enum ErrorResponseMessage {
  OutOfRam = 'I can not open the program. There is not enough RAM available. Close some program and try again.',
  DesktopUI = 'Error: Desktop GUI is not running.',
  CanOnlyRunOnComputer = 'Error: this program can only be run on computers.',
  CannotBeExecutedRemotely = 'Error: this program can not be executed remotely',
  CannotLaunch = "Can't launch program. Permission denied.",
  NotAttached = 'Error: script is not attached to any existing terminal',
  DeviceNotFound = 'Error: device not found.',
  NoInternet = 'Error: No internet connection',
  InvalidCommand = 'Unknown error: invalid command.'
}

export enum AgentType {
  C2 = 'headless',
  C2Light = 'message-hook'
}

export enum ImporterMode {
  Local = 'local',
  Public = 'public'
}

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

  constructor(options: ImporterOptions) {
    this.target = options.target;
    this.ingameDirectory = options.ingameDirectory.trim().replace(/\/$/i, '');
    this.importRefs = this.createImportList(options.target, options.result);
    this.agentType = options.agentType;
    this.mode = options.mode;
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
        console.log(`Imported ${item.ingameFilepath} successful`);
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
            console.log(`Importing got aborted due to ${response.message}`);
            return results;
          }
          default: {
            console.error(
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
        ({ output }) => console.log(output)
      );
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
