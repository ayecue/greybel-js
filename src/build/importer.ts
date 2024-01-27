import GreybelAgentPkg from 'greybel-agent';
import { TranspilerParseResult } from 'greybel-transpiler';
import storage from 'node-persist';
import path from 'path';

import { createBasePath } from './create-base-path.js';
const { GreybelC2Agent, GreybelC2LightAgent } = GreybelAgentPkg;

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

type ImportResult = {
  path: string;
  success: boolean;
};

export interface ImporterOptions {
  target: string;
  mode: ImporterMode;
  ingameDirectory: string;
  agentType: AgentType;
  result: TranspilerParseResult;
}

class Importer {
  private importList: ImportItem[];
  private agentType: AgentType;
  private target: string;
  private ingameDirectory: string;
  private mode: ImporterMode;

  constructor(options: ImporterOptions) {
    this.target = options.target;
    this.ingameDirectory = options.ingameDirectory;
    this.importList = this.createImportList(options.target, options.result);
    this.agentType = options.agentType;
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

  async createAgent(): Promise<any> {
    switch (this.agentType) {
      case AgentType.C2: {
        await storage.init();

        return new GreybelC2Agent({
          connectionType: IMPORTER_MODE_MAP[this.mode],
          refreshToken: await storage.getItem('greybel.steam.refreshToken'),
          onSteamRefreshToken: (code) =>
            storage.setItem('greybel.steam.refreshToken', code)
        });
      }
      case AgentType.C2Light: {
        return new GreybelC2LightAgent();
      }
    }
  }

  async import(): Promise<ImportResult[]> {
    if (!Object.prototype.hasOwnProperty.call(IMPORTER_MODE_MAP, this.mode)) {
      throw new Error('Unknown import mode.');
    }

    const agent = await this.createAgent();
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
