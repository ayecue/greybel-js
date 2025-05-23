import fs from 'fs';
import path from 'path';

import { escapeMSString } from './escape-ms-string.js';

function readVarLines(
  varLines: string[],
  map: { [key: string]: string }
): { [key: string]: string } {
  if (map == null) map = {};

  let line;

  for (line of varLines) {
    line = line.trim();
    if (line === '' || line[0] === '#') continue;
    const eqIndex = line.indexOf('=');
    if (eqIndex === -1) continue;
    const name = line.substring(0, eqIndex).trim();
    const value = line.substring(eqIndex + 1);

    if (name && value) {
      map[name] = value;
    }
  }

  return map;
}

function loadConfigFile(
  filepath: string,
  map: { [key: string]: string }
): { [key: string]: string } {
  filepath = path.resolve(filepath);

  if (!fs.existsSync(filepath)) {
    throw new Error('No file: ' + filepath);
  }

  const content = fs.readFileSync(filepath, 'utf8');

  return readVarLines(content.split('\n'), map);
}

export class EnvironmentVariablesManager {
  map: { [key: string]: string };

  constructor() {
    this.map = {};
  }

  load(envFiles?: string[], envVars?: string[]): { [key: string]: string } {
    const me = this;

    if (envFiles) {
      let file;
      for (file of envFiles) {
        me.map = loadConfigFile(file, me.map);
      }
    }

    if (envVars) me.map = readVarLines(envVars, me.map);

    return me.map;
  }

  get(key: string): string | null {
    const me = this;
    const varExists = key in me.map;
    if (varExists) return me.map[key];
    return null;
  }

  toMap(escape: boolean = false): Map<string, string> {
    const entries = Object.entries(this.map);

    if (escape) {
      return new Map(
        entries.map(([key, value]) => [key, escapeMSString(value)])
      );
    }

    return new Map(entries);
  }
}
