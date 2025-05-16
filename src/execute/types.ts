import { CustomFunction } from 'greybel-interpreter';

import { EnvironmentVariablesManager } from '../helper/env-mapper.js';

export interface ExecuteOptions {
  api: Map<string, CustomFunction>;
  params: string[];
  seed?: string;
  port?: number;
  programName?: string;
  envFiles: string[];
  envVars: string[];
  debugMode: boolean;
  envType: SessionEnvironmentType;
  fileExtensions: string[] | null;
}

export interface Session {
  prepare(): Promise<void>;
  run(params: string[]): Promise<boolean>;
}

export interface SessionConstructor {
  new (options: SessionOptions): Session;
}

export interface SessionOptions {
  target: string;
  envMapper: EnvironmentVariablesManager;
  debugMode?: boolean;
}

declare var Session: SessionConstructor;

export enum SessionEnvironmentType {
  Mock = 'mock',
  Ingame = 'in-game'
}

export enum ClientMessageType {
  SendFileSizeClientRpc = 75,
  DecipherTimeClientRpc = 77,
  ClearScreenClientRpc = 79,
  InputSentClientRpc = 80,
  PrintSentClientRpc = 81,
  CreatedContextRpc = 1000,
  FinishedContextRpc = 1002,
  ContextRuntimeStateRpc = 1003,
  ContextLoadFileRpc = 1004,
  ContextBreakpointRpc = 1005,
  ContextOpenInternalFileRpc = 1009,
  ContextUnexpectedErrorRpc = 1010,
  DisposedContextRpc = 1020,
  StatusRpc = 1200,
  InvalidAction = 1300
}

export interface StackItem {
  filepath: string;
  lineNum: number;
  name: string;
  isExternal: boolean;
}

export interface ContextBreakpoint {
  contextID: string;
  filepath: string;
  source: string;
  line: number;
  variables: Record<string, string>;
  stacktrace: StackItem[];
}
