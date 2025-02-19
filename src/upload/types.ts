import { AgentType } from "../build/types.js";

export interface UploadOptions {
  ingameDirectory: string;
}

const defaultOptions: UploadOptions = {
  ingameDirectory: '/root/'
};

export const parseUploadOptions = (options: Partial<UploadOptions>) => {
  return {
    ingameDirectory: options.ingameDirectory ?? defaultOptions.ingameDirectory
  };
};