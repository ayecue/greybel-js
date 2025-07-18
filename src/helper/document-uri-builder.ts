import pathUtil from 'path';

import { configurationManager } from './configuration-manager.js';
import { FileSystemManager, GlobalFileSystemManager } from './fs.js';

export class DocumentURIBuilder {
  readonly rootPath: string;
  readonly fileExtensions: string[];

  private fileSystemManager: FileSystemManager;

  constructor(
    rootPath: string,
    fileSystemManager: FileSystemManager = GlobalFileSystemManager
  ) {
    this.rootPath = rootPath;
    this.fileExtensions = configurationManager.get<string[]>('fileExtensions');
    this.fileSystemManager = fileSystemManager;
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
    return this.fileSystemManager.findExistingPath(
      this.getOriginalPath(path),
      ...this.getAlternativePaths(path)
    );
  }
}
