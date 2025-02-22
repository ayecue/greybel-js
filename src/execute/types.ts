import { CustomFunction } from 'greybel-interpreter';

export interface ExecuteOptions {
  api: Map<string, CustomFunction>;
  params: string[];
  seed: string;
  envFiles: string[];
  envVars: string[];
  debugMode: boolean;
}
