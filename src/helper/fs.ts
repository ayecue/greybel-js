import { crlf, LF } from 'crlf-normalize';
import fs from 'fs/promises';
import path from 'path';

export class FileSystemManager {
  basename(file: string): string {
    return path.basename(file);
  }

  dirname(file: string): string {
    return path.dirname(file);
  }

  resolve(file: string): string {
    return path.resolve(file);
  }

  async tryToGet(
    target: string,
    unsafe: boolean = false
  ): Promise<string | null> {
    try {
      return await fs.readFile(target, 'utf-8');
    } catch (err) {
      if (!unsafe) console.error(err);
    }

    return null;
  }

  async tryToDecode(
    target: string,
    unsafe: boolean = false
  ): Promise<string | null> {
    const out = await this.tryToGet(target, unsafe);

    if (out != null) {
      return crlf(out, LF);
    }

    return null;
  }

  async checkFileExists(target: string): Promise<boolean> {
    return fs
      .access(target, fs.constants.F_OK)
      .then(() => true)
      .catch(() => false);
  }

  async findExistingPath(
    mainPath: string,
    ...altPaths: string[]
  ): Promise<string | null> {
    if (await this.checkFileExists(mainPath)) return mainPath;

    if (altPaths.length === 0) {
      return null;
    }

    try {
      const altItemPath = await Promise.any(
        altPaths.map(async (path) => {
          if (await this.checkFileExists(path)) return path;
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
}

export class FileSystemManagerWithCache extends FileSystemManager {
  private fileContentCache: Map<string, string>;
  private fileExistsCache: Map<string, boolean>;
  private pathResolveCache: Map<string, string>;

  constructor() {
    super();
    this.fileContentCache = new Map<string, string>();
    this.pathResolveCache = new Map<string, string>();
    this.fileExistsCache = new Map<string, boolean>();
  }

  async checkFileExists(target: string): Promise<boolean> {
    const key = target.toString();
    const cachedExists = this.fileExistsCache.get(key);
    if (cachedExists !== undefined) {
      return cachedExists;
    }
    const exists = await super.checkFileExists(target);
    this.fileExistsCache.set(key, exists);
    return exists;
  }

  async tryToGet(
    target: string,
    unsafe: boolean = false
  ): Promise<string | null> {
    const key = target;
    const result = this.fileContentCache.get(key);

    if (result) {
      return result;
    }

    const content = await super.tryToGet(target, unsafe);
    this.fileContentCache.set(key, content);
    return content;
  }

  async findExistingPath(
    mainPath: string,
    ...altPaths: string[]
  ): Promise<string | null> {
    const key = mainPath;
    const cachedPath = this.pathResolveCache.get(key);

    if (cachedPath) {
      return cachedPath;
    }

    const result = await super.findExistingPath(mainPath, ...altPaths);
    this.pathResolveCache.set(key, result);
    return result;
  }
}

export const GlobalFileSystemManager = new FileSystemManager();
