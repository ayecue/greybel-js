import { AgentType, ImporterMode } from "../build/types.js";

export interface UploadOptions {
  ingameDirectory: string;
  createIngameAgentType: string;
  createIngameMode: string;
}

const defaultOptions: UploadOptions = {
  ingameDirectory: '/root/',
  createIngameAgentType: AgentType.C2,
  createIngameMode: ImporterMode.Local
};

export const parseUploadOptions = (options: Partial<UploadOptions>) => {
  return {
    ingameDirectory: options.ingameDirectory ?? defaultOptions.ingameDirectory,
    createIngameAgentType:
      options.createIngameAgentType ?? defaultOptions.createIngameAgentType,
    createIngameMode:
      options.createIngameMode ?? defaultOptions.createIngameMode
  };
};