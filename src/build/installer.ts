import fs from 'fs/promises';
import { TranspilerParseResult } from 'greybel-transpiler';
import path from 'path';

import { generateAutoCompileCode } from './scripts/auto-compile-helper.js';
import { createBasePath } from '../helper/create-base-path.js';
import { escapeMSString } from '../helper/escape-ms-string.js';
import { generateContentHeader } from './scripts/installer-content-header.js';

type ImportItem = {
  filepath: string;
  ingameFilepath: string;
  content: string;
};

interface InstallerFileOptions {
  destination: string;
  contentHeader: string;
  maxChars: number;
  previous?: InstallerFile;
}

class InstallerFile {
  readonly maxChars: number;

  private destination: string;
  private items: ImportItem[];
  private buffer: string;
  private previous: InstallerFile | null;

  constructor(options: InstallerFileOptions) {
    this.destination = options.destination;
    this.maxChars = options.maxChars;
    this.buffer = options.contentHeader;
    this.items = [];
    this.previous = options.previous ?? null;
  }

  insert(item: ImportItem): boolean {
    const isNew = !this.previous?.items.includes(item);
    const remaining = this.getRemainingSpace();
    const filePath = `${this.destination}${item.ingameFilepath}`;
    let line = `m("${filePath}","${item.content}",${isNew ? '1' : '0'});d`;

    if (remaining > line.length) {
      this.buffer += line.slice(0, -1);
      this.items.push(item);
      item.content = '';
      return true;
    }

    let diff = item.content.length + (remaining - line.length);

    if (diff <= 0) {
      return false;
    }

    let content = item.content.slice(0, diff);
    const endingQuotes = content.match(/"+$/)?.[0];

    if (endingQuotes && endingQuotes.length % 2 === 1) {
      content = item.content.slice(0, --diff);
    }

    line = `m("${filePath}","${content}",${isNew ? '1' : '0'});d`;
    this.buffer += line;
    this.items.push(item);
    item.content = item.content.slice(diff);

    return false;
  }

  appendCode(content: string) {
    const remaining = this.getRemainingSpace();

    if (remaining > content.length) {
      this.buffer += content;
      return true;
    }

    return false;
  }

  getCode(): string {
    return this.buffer;
  }

  getRemainingSpace(): number {
    return this.maxChars - this.buffer.length;
  }
}

export interface InstallerOptions {
  rootDir: string;
  ingameDirectory: string;
  resourceDirectory: string;
  rootPaths: string[];
  buildPath: string;
  result: TranspilerParseResult;
  maxChars: number;
  autoCompile: {
    enabled: boolean;
    allowImport: boolean;
  };
}

class Installer {
  private importList: ImportItem[];
  private rootDir: string;
  private rootPaths: string[];
  private ingameDirectory: string;
  private resourceDirectory: string;
  private buildPath: string;
  private maxChars: number;

  private files: InstallerFile[];
  private createdFiles: string[];

  private autoCompile: {
    enabled: boolean;
    allowImport: boolean;
  };

  constructor(options: InstallerOptions) {
    this.rootDir = options.rootDir;
    this.buildPath = options.buildPath;
    this.rootPaths = options.rootPaths;
    this.ingameDirectory = options.ingameDirectory.trim().replace(/\/$/i, '');
    this.resourceDirectory = options.resourceDirectory.trim().replace(/\/$/i, '');
    this.maxChars = options.maxChars;
    this.autoCompile = options.autoCompile;
    this.files = [];
    this.importList = this.createImportList(options.rootDir, options.result);
    this.createdFiles = [];
    this.autoCompile = options.autoCompile;
  }

  private getDestination(): string {
    return this.autoCompile ? this.resourceDirectory : this.ingameDirectory;
  }

  public getCreatedFiles(): string[] {
    return this.createdFiles;
  }

  private async createInstallerFiles(): Promise<void> {
    await Promise.all(
      this.files.map(async (file, index) => {
        const target = path.resolve(
          this.buildPath,
          'installer' + index + '.src'
        );

        this.createdFiles.push(target);

        await fs.writeFile(target, file.getCode(), { encoding: 'utf-8' });
      })
    );
  }

  private createImportList(
    rootDir: string,
    parseResult: TranspilerParseResult
  ): ImportItem[] {
    const imports = Object.entries(parseResult).map(([target, code]) => {
      const ingameFilepath = createBasePath(rootDir, target, '');

      return {
        filepath: target,
        ingameFilepath,
        content: escapeMSString(code).replace(
          /import_code\(/gi,
          'import"+"_"+"code('
        )
      };
    });

    return imports;
  }

  createContentHeader(): string {
    return [
      `BUILD_DESTINATION="${this.ingameDirectory}"`,
      `BUILD_RESOURCE_DESTINATION="${this.resourceDirectory}"`,
      `BUILD_AUTO_COMPILE=${this.autoCompile ? '1' : '0'}`,
      generateContentHeader(),
      ''
    ]
      .map((line) => line.trim())
      .join(';');
  }

  createContentFooterAutoCompile(): string[] {
    if (this.autoCompile.enabled) {
      const rootImports = this.rootPaths.map((it) => {
        return this.importList.find((item) => item.filepath === it);
      });

      return generateAutoCompileCode({
        rootFilePaths: rootImports.map((it) => it.ingameFilepath),
        importPaths: this.importList.map((it) => it.ingameFilepath),
        allowImport: this.autoCompile.allowImport
      }).split(';');
    }

    return [];
  }

  createContentFooter(): string {
    return ['d', ...this.createContentFooterAutoCompile(), ''].join(';');
  }

  async build() {
    let file = new InstallerFile({
      destination: this.getDestination(),
      contentHeader: this.createContentHeader(),
      maxChars: this.maxChars
    });
    this.files.push(file);

    for (const item of this.importList) {
      let done = false;

      while (!done) {
        done = file.insert(item);

        if (!done) {
          file = new InstallerFile({
            destination: this.getDestination(),
            contentHeader: this.createContentHeader(),
            maxChars: this.maxChars,
            previous: file
          });
          this.files.push(file);
        }
      }
    }

    const contentFooter = this.createContentFooter();

    if (!file.appendCode(contentFooter)) {
      file = new InstallerFile({
        destination: this.getDestination(),
        contentHeader: contentFooter,
        maxChars: this.maxChars,
        previous: file
      });
      this.files.push(file);
    }

    await this.createInstallerFiles();
  }
}

export const createInstaller = async (
  options: InstallerOptions
): Promise<string[]> => {
  const installer = new Installer(options);
  await installer.build();
  return installer.getCreatedFiles();
};
