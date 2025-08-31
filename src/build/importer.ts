import { TranspilerParseResult } from 'greybel-transpiler';
import GreyHackMessageHookClientPkg from 'greyhack-message-hook-client';

import { generateAutoCompileCode } from '../helper/auto-compile-helper.js';
import { generateAutoGenerateFoldersCode } from '../helper/auto-generate-folders.js';
import { createBasePath } from '../helper/create-base-path.js';
import { logger } from '../helper/logger.js';
const { BuildAgent: Agent } = GreyHackMessageHookClientPkg;

enum ClientMessageType {
  CreatedBuildRpc = 1100,
  AddedResourceToBuildRpc = 1101,
  AddedScriptRpc = 1102,
  BuildStateRpc = 1103,
  BuildFinishedRpc = 1104,
  DisposedBuildRpc = 1110
}

enum BuildState {
  Initial = 0,
  Allocating = 1,
  PreScript = 2,
  CreatingEntities = 3,
  PostScript = 4,
  Closing = 5,
  Complete = 10,
  Failed = 20,
  Unknown = 30
}

type ImportItem = {
  ingameFilepath: string;
  content: string;
};

export type ImportResult = {
  buildID: string;
  state: BuildState;
  errorMessage: string;
  output: string;
};

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
  private agent: any;
  private _instance: any;
  private rootPaths: string[];
  private ingameDirectory: string;
  private port: number;
  private autoCompile: {
    enabled: boolean;
    purge: boolean;
    allowImport: boolean;
  };

  constructor(options: ImporterOptions) {
    this.agent = new Agent(
      {
        warn: () => {},
        error: () => {},
        info: () => {},
        debug: () => {}
      },
      this.port
    );
    this._instance = null;
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

  private async addPrepareFoldersScript(): Promise<void> {
    const ingamePaths = Array.from(this.importRefs.values()).map(
      (it) => it.ingameFilepath
    );

    await this._instance.addScriptToBuild(
      10,
      generateAutoGenerateFoldersCode(this.ingameDirectory, ingamePaths)
    );
  }

  private async addResources(): Promise<void> {
    const defers: Promise<any>[] = [];

    for (const item of this.importRefs.values()) {
      defers.push(
        this._instance.addResourceToBuild(
          this.ingameDirectory + item.ingameFilepath,
          item.content
        )
      );
    }

    await Promise.all(defers);
  }

  private async addAutoCompile(): Promise<void> {
    const rootImports = this.rootPaths.map((it) => {
      return this.importRefs.get(it);
    });
    await this._instance.addScriptToBuild(
      20,
      generateAutoCompileCode({
        rootDirectory: this.ingameDirectory,
        rootFilePaths: rootImports.map((it) => it.ingameFilepath),
        importPaths: Array.from(this.importRefs.values()).map(
          (it) => it.ingameFilepath
        ),
        purge: this.autoCompile.purge,
        allowImport: this.autoCompile.allowImport
      })
    );
  }

  async import(): Promise<ImportResult> {
    try {
      const result = await this.agent.tryToCreateBuild();

      if (!result.success) {
        return {
          buildID: null,
          state: BuildState.Unknown,
          errorMessage: result.message,
          output: ''
        };
      }

      this._instance = result.value;

      console.time('Preparation Time');
      await this.addPrepareFoldersScript();
      await this.addResources();

      if (this.autoCompile) {
        await this.addAutoCompile();
      }

      console.timeEnd('Preparation Time');

      console.time('Build Time');
      await this._instance.performBuild();
      console.timeEnd('Build Time');

      const buildResult = await this._instance.waitForResponse((id) => {
        return (
          id === ClientMessageType.BuildFinishedRpc ||
          id === ClientMessageType.DisposedBuildRpc
        );
      });

      return {
        buildID: buildResult.buildID,
        state: buildResult.state as BuildState,
        errorMessage: buildResult.errorMessage,
        output: buildResult.output
      };
    } catch (e) {
      return {
        buildID: null,
        state: BuildState.Unknown,
        errorMessage: e.message,
        output: ''
      };
    } finally {
      try {
        await this._instance.dispose();
      } catch {}

      this._instance = null;
      await this.agent.dispose();
    }
  }
}

enum CommonImportErrorReason {
  NoAvailableSocket = 'There is no available socket!',
  NewGameVersion = 'A new game update is available.'
}

const reportFailure = (result: ImportResult): void => {
  if (
    result.errorMessage.indexOf(CommonImportErrorReason.NoAvailableSocket) !==
    -1
  ) {
    logger.debug(`File import failed

The issue appears to be due to the lack of an available socket. This could suggest that the BepInEx plugin is not installed correctly, or the game is not running. Double-check the plugin installation and ensure the game is running.

For detailed troubleshooting steps, please consult the documentation: https://github.com/ayecue/greybel-js?tab=readme-ov-file#message-hook.`);
    return;
  } else if (
    result.errorMessage.indexOf(CommonImportErrorReason.NewGameVersion) !== -1
  ) {
    logger.debug(`File import failed

It seems that the game has received an update. This can sometimes cause issues with the import process. Please wait for the Greybel developers to update the package and try again later.`);
    return;
  }

  logger.debug(`File import failed!

${result.errorMessage}`);
};

export const executeImport = async (
  options: ImporterOptions
): Promise<boolean> => {
  const importer = new Importer(options);
  const result = await importer.import();

  if (result.state !== BuildState.Complete) {
    reportFailure(result);
    return false;
  }

  logger.debug(`Files got imported to ${options.ingameDirectory}!`);

  return true;
};
