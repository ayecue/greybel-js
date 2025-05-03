import { CustomFunction } from 'greybel-interpreter';
import EnvMapper from '../helper/env-mapper.js';

export interface ExecuteOptions {
  api: Map<string, CustomFunction>;
  params: string[];
  seed: string;
  envFiles: string[];
  envVars: string[];
  debugMode: boolean;
  envType: SessionEnvironmentType;
}

export interface Session {
  prepare(): Promise<void>;
  run(params: string[]): Promise<boolean>;
}

export interface SessionConstructor {
  new(options: SessionOptions): Session;
}

export interface SessionOptions {
  target: string;
  envMapper: EnvMapper;
  debugMode?: boolean;
}

declare var Session: SessionConstructor;

export enum SessionEnvironmentType {
  Mock = 'Mock',
  Ingame = 'In-Game'
}