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

export enum BeautifyIndentationType {
  Tab = 'tab',
  Whitespace = 'whitespace'
}

export interface BuildOptions {
  disableBuildFolder: boolean;
  // transformer
  uglify: boolean;
  beautify: boolean;
  beautifyKeepParentheses: boolean;
  beautifyIndentation: string;
  beautifyIndentationSpaces: number;
  obfuscation: boolean;
  excludedNamespaces: string[];
  disableLiteralsOptimization: boolean;
  disableNamespacesOptimization: boolean;
  envFiles: string[];
  envVars: string[];
  // installer + in-game importer
  installer: boolean;
  allowImport: boolean;
  maxChars: number;
  autoCompile: boolean;
  ingameDirectory: string;
  createIngame: boolean;
  createIngameAgentType: string;
  createIngameMode: string;
  autoCompilePurge: boolean;
  autoCompileName: string | null;
}

const defaultOptions: BuildOptions = {
  disableBuildFolder: false,
  uglify: false,
  beautify: false,
  beautifyKeepParentheses: false,
  beautifyIndentation: BeautifyIndentationType.Tab,
  beautifyIndentationSpaces: 2,
  obfuscation: false,
  installer: false,
  autoCompile: false,
  allowImport: false,
  excludedNamespaces: [],
  disableLiteralsOptimization: false,
  disableNamespacesOptimization: false,
  maxChars: 160000,
  envFiles: [],
  envVars: [],
  ingameDirectory: '/root/',
  createIngame: false,
  createIngameAgentType: AgentType.C2,
  createIngameMode: ImporterMode.Local,
  autoCompilePurge: false,
  autoCompileName: null
};

export const parseBuildOptions = (options: Partial<BuildOptions>) => {
  return {
    disableBuildFolder:
      options.disableBuildFolder ?? defaultOptions.disableBuildFolder,
    uglify: options.uglify ?? defaultOptions.uglify,
    beautify: options.beautify ?? defaultOptions.beautify,
    beautifyKeepParentheses:
      options.beautifyKeepParentheses ?? defaultOptions.beautifyKeepParentheses,
    beautifyIndentation:
      options.beautifyIndentation ?? defaultOptions.beautifyIndentation,
    beautifyIndentationSpaces:
      options.beautifyIndentationSpaces ??
      defaultOptions.beautifyIndentationSpaces,
    obfuscation: options.obfuscation ?? defaultOptions.obfuscation,
    installer: options.installer ?? defaultOptions.installer,
    autoCompile: options.autoCompile ?? defaultOptions.autoCompile,
    allowImport: options.allowImport ?? defaultOptions.allowImport,
    excludedNamespaces:
      options.excludedNamespaces ?? defaultOptions.excludedNamespaces,
    disableLiteralsOptimization:
      options.disableLiteralsOptimization ??
      defaultOptions.disableLiteralsOptimization,
    disableNamespacesOptimization:
      options.disableNamespacesOptimization ??
      defaultOptions.disableNamespacesOptimization,
    maxChars: options.maxChars ?? defaultOptions.maxChars,
    envFiles: options.envFiles ?? defaultOptions.envFiles,
    envVars: options.envVars ?? defaultOptions.envVars,
    ingameDirectory: options.ingameDirectory ?? defaultOptions.ingameDirectory,
    createIngame: options.createIngame ?? defaultOptions.createIngame,
    createIngameAgentType:
      options.createIngameAgentType ?? defaultOptions.createIngameAgentType,
    createIngameMode:
      options.createIngameMode ?? defaultOptions.createIngameMode,
    autoCompilePurge:
      options.autoCompilePurge ?? defaultOptions.autoCompilePurge,
    autoCompileName: options.autoCompileName ?? defaultOptions.autoCompileName
  };
};
