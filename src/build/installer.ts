import fs from 'fs/promises';
import { TranspilerParseResult } from 'greybel-transpiler';
import path from 'path';

import { createBasePath } from './create-base-path.js';

type ImportItem = {
  filepath: string;
  ingameFilepath: string;
  content: string;
};

interface InstallerFileOptions {
  contentHeader: string;
  maxChars: number;
  previous?: InstallerFile;
}

class InstallerFile {
  readonly maxChars: number;

  private items: ImportItem[];
  private buffer: string;
  private previous: InstallerFile | null;

  constructor(options: InstallerFileOptions) {
    this.maxChars = options.maxChars;
    this.buffer = options.contentHeader;
    this.items = [];
    this.previous = options.previous ?? null;
  }

  insert(item: ImportItem): boolean {
    const isNew = !this.previous?.items.includes(item);
    const remaining = this.getRemainingSpace();
    let line = `m("${item.ingameFilepath}","${item.content}",${
      isNew ? '1' : '0'
    });d`;

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

    line = `m("${item.ingameFilepath}","${content}",${isNew ? '1' : '0'});d`;
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
  target: string;
  ingameDirectory: string;
  buildPath: string;
  result: TranspilerParseResult;
  maxChars: number;
  autoCompile: boolean;
}

class Installer {
  private importList: ImportItem[];
  private target: string;
  private ingameDirectory: string;
  private buildPath: string;
  private maxChars: number;
  private autoCompile: boolean;

  private files: InstallerFile[];
  private createdFiles: string[];

  constructor(options: InstallerOptions) {
    this.target = options.target;
    this.buildPath = options.buildPath;
    this.ingameDirectory = options.ingameDirectory;
    this.maxChars = options.maxChars;
    this.autoCompile = options.autoCompile;
    this.files = [];
    this.importList = this.createImportList(options.target, options.result);
    this.createdFiles = [];
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
    rootTarget: string,
    parseResult: TranspilerParseResult
  ): ImportItem[] {
    const imports = Object.entries(parseResult).map(([target, code]) => {
      const ingameFilepath = `${this.ingameDirectory}${createBasePath(
        rootTarget,
        target,
        ''
      )}`;

      return {
        filepath: target,
        ingameFilepath,
        content: code
          .replace(/"/g, '""')
          .replace(/import_code\(/gi, 'import"+"_"+"code(')
      };
    });

    return imports;
  }

  createContentHeader(): string {
    return [
      's=get_shell',
      'c=s.host_computer',
      'm=function(t,z,r)',
      'x=t.split("/")[1:]',
      'e=x.pop',
      'for y in x',
      'if (__y_idx==0) then continue',
      'c.create_folder("/"+x[:__y_idx].join("/"),y)',
      'end for',
      'c.touch("/"+x.join("/"),e)',
      'j=c.File(t)',
      'if r then',
      'j.set_content(z)',
      'print("New file """+t+""" got created.")',
      'else',
      'j.set_content(j.get_content+z)',
      'print("Content got appended to """+t+""".")',
      'end if',
      'end function',
      'd=function',
      'c.File(program_path).delete',
      'end function',
      ''
    ].join(';');
  }

  createContentFooterAutoCompile(): string[] {
    if (this.autoCompile) {
      const entryFile = this.importList.find(
        (item) => item.filepath === this.target
      );

      return [
        `i=s.build("${entryFile.ingameFilepath}","${path.posix.dirname(
          entryFile.ingameFilepath
        )}")`,
        'if i!="" then exit("Error when building!")',
        ...this.importList.map(
          (item) => `c.File("${item.ingameFilepath}").delete`
        )
      ];
    }

    return [];
  }

  createContentFooter(): string {
    return ['d', ...this.createContentFooterAutoCompile(), ''].join(';');
  }

  async build() {
    let file = new InstallerFile({
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
