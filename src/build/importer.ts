import GreybelC2AgentPkg from 'greybel-proxy';
import { TranspilerParseResult } from 'greybel-transpiler';
import storage from 'node-persist';
import path from 'path';

import { createBasePath } from './create-base-path.js';
const { GreybelC2Agent } = GreybelC2AgentPkg;

const IMPORTER_MODE_MAP = {
  local: 2,
  public: 0
};

type ImportItem = {
  ingameFilepath: string;
  content: string;
};

type ImportResult = {
  path: string;
  success: boolean;
};

export interface ImporterOptions {
  target: string;
  ingameDirectory: string;
  result: TranspilerParseResult;
  mode: string;
}

class Importer {
  private importList: ImportItem[];
  private target: string;
  private ingameDirectory: string;
  private mode: string;

  constructor(options: ImporterOptions) {
    this.target = options.target;
    this.ingameDirectory = options.ingameDirectory;
    this.importList = this.createImportList(options.target, options.result);
    this.mode = options.mode;
  }

  private createImportList(
    rootTarget: string,
    parseResult: TranspilerParseResult
  ): ImportItem[] {
    const imports = Object.entries(parseResult).map(([target, code]) => {
      const ingameFilepath = createBasePath(rootTarget, target, '');

      return {
        ingameFilepath,
        content: code
      };
    });

    return imports;
  }

  async import(): Promise<ImportResult[]> {
    if (!Object.prototype.hasOwnProperty.call(IMPORTER_MODE_MAP, this.mode)) {
      throw new Error('Unknown import mode.');
    }

    await storage.init();

    const agent = new GreybelC2Agent({
      connectionType: IMPORTER_MODE_MAP[this.mode],
      refreshToken: await storage.getItem('greybel.steam.refreshToken'),
      onSteamRefreshToken: (code) =>
        storage.setItem('greybel.steam.refreshToken', code)
    });
    const results: ImportResult[] = [];

    for (const item of this.importList) {
      const isCreated = await agent.tryToCreateFile(
        this.ingameDirectory + path.posix.dirname(item.ingameFilepath),
        path.basename(item.ingameFilepath),
        item.content
      );

      if (isCreated) {
        console.log(`Imported ${item.ingameFilepath} successful`);
        results.push({ path: item.ingameFilepath, success: true });
      } else {
        console.log(`Importing of ${item.ingameFilepath} failed`);
        results.push({ path: item.ingameFilepath, success: false });
      }
    }

    await agent.dispose();

    return results;
  }
}

export const createImporter = async (
  options: ImporterOptions
): Promise<ImportResult[]> => {
  const installer = new Importer(options);
  return await installer.import();
};
