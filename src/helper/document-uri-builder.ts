import fs from 'fs';
import pathUtil from 'path';
import { configurationManager } from './configuration-manager.js';

export function checkFileExists(file) {
  return fs.promises
    .access(file, fs.constants.F_OK)
    .then(() => true)
    .catch(() => false);
}

export async function findExistingPath(
  mainPath: string,
  ...altPaths: string[]
): Promise<string | null> {
  if (await checkFileExists(mainPath)) return mainPath;

  if (altPaths.length === 0) {
    return null;
  }

  try {
    const altItemPath = await Promise.any(
      altPaths.map(async (path) => {
        if (await checkFileExists(path)) return path;
        throw new Error('Alternative path could not resolve');
      })
    );

    if (altItemPath != null) {
      return altItemPath;
    }

    return null;
  } catch (err) {
    return null;
  }
}

export class DocumentURIBuilder {
  readonly rootPath: string;
  readonly fileExtensions: string[];

  constructor(rootPath: string) {
    this.rootPath = rootPath;
    this.fileExtensions = configurationManager.get<string[]>(
      'fileExtensions'
    );
  }

  private getFromRootPath(path: string): string {
    return pathUtil.join(this.rootPath, path);
  }

  private getAlternativePaths(path: string): string[] {
    return this.fileExtensions.map((ext) => {
      return this.getFromRootPath(`${path}.${ext}`);
    });
  }

  private getOriginalPath(path: string): string {
    return this.getFromRootPath(path);
  }

  async getPathUseReturnOriginal(path: string): Promise<string | null> {
    return (await this.getPath(path)) ?? this.getOriginalPath(path);
  }

  getPath(path: string): Promise<string | null> {
    return findExistingPath(
      this.getOriginalPath(path),
      ...this.getAlternativePaths(path)
    );
  }
}
