import { AgentType, ImporterMode } from './importer.js';

export interface BuildOptions {
  uglify: boolean;
  beautify: boolean;
  obfuscation: boolean;
  installer: boolean;
  autoCompile: boolean;
  excludedNamespaces: string[];
  disableLiteralsOptimization: boolean;
  disableNamespacesOptimization: boolean;
  envFiles: string[];
  envVars: string[];
  maxChars: number;
  ingameDirectory: string;
  // Create ingame
  createIngame: boolean;
  createIngameAgentType: string;
  createIngameMode: string;
}

const defaultOptions: BuildOptions = {
  uglify: false,
  beautify: false,
  obfuscation: false,
  installer: false,
  autoCompile: false,
  excludedNamespaces: [],
  disableLiteralsOptimization: false,
  disableNamespacesOptimization: false,
  maxChars: 160000,
  envFiles: [],
  envVars: [],
  ingameDirectory: '/root/',
  createIngame: false,
  createIngameAgentType: AgentType.C2,
  createIngameMode: ImporterMode.Local
};

export const parseBuildOptions = (options: Partial<BuildOptions>) => {
  return {
    uglify: options.uglify || defaultOptions.uglify,
    beautify: options.beautify || defaultOptions.beautify,
    obfuscation: options.obfuscation || defaultOptions.obfuscation,
    installer: options.installer || defaultOptions.installer,
    autoCompile: options.autoCompile || defaultOptions.autoCompile,
    excludedNamespaces:
      options.excludedNamespaces || defaultOptions.excludedNamespaces,
    disableLiteralsOptimization:
      options.disableLiteralsOptimization ||
      defaultOptions.disableLiteralsOptimization,
    disableNamespacesOptimization:
      options.disableNamespacesOptimization ||
      defaultOptions.disableNamespacesOptimization,
    maxChars: options.maxChars || defaultOptions.maxChars,
    envFiles: options.envFiles || defaultOptions.envFiles,
    envVars: options.envVars || defaultOptions.envVars,
    ingameDirectory: options.ingameDirectory || defaultOptions.ingameDirectory,
    createIngame: options.createIngame || defaultOptions.createIngame,
    createIngameAgentType:
      options.createIngameAgentType || defaultOptions.createIngameAgentType,
    createIngameMode:
      options.createIngameMode || defaultOptions.createIngameMode
  };
};
