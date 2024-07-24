import fs from 'fs/promises';
import { TranspilerParseResult } from 'greybel-transpiler';
import path from 'path';

import { generateAutoCompileCode } from './auto-compile-helper.js';
import { createBasePath } from './create-base-path.js';

type ImportItem = {
  filepath: string;
  ingameFilepath: string;
  content: string;
};

interface InstallerFileOptions {
  rootDirectory: string;
  contentHeader: string;
  maxChars: number;
  previous?: InstallerFile;
}

class InstallerFile {
  readonly maxChars: number;

  private rootDirectory: string;
  private items: ImportItem[];
  private buffer: string;
  private previous: InstallerFile | null;

  constructor(options: InstallerFileOptions) {
    this.rootDirectory = options.rootDirectory;
    this.maxChars = options.maxChars;
    this.buffer = options.contentHeader;
    this.items = [];
    this.previous = options.previous ?? null;
  }

  insert(item: ImportItem): boolean {
    const isNew = !this.previous?.items.includes(item);
    const remaining = this.getRemainingSpace();
    const filePath = `${this.rootDirectory}${item.ingameFilepath}`;
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
  target: string;
  ingameDirectory: string;
  buildPath: string;
  result: TranspilerParseResult;
  maxChars: number;
  autoCompile: {
    enabled: boolean;
    purge: boolean;
    binaryName: string | null;
  };
}

class Installer {
  private importList: ImportItem[];
  private target: string;
  private ingameDirectory: string;
  private buildPath: string;
  private maxChars: number;

  private files: InstallerFile[];
  private createdFiles: string[];

  private autoCompile: {
    enabled: boolean;
    purge: boolean;
    binaryName: string | null;
  };

  constructor(options: InstallerOptions) {
    this.target = options.target;
    this.buildPath = options.buildPath;
    this.ingameDirectory = options.ingameDirectory.trim().replace(/\/$/i, '');
    this.maxChars = options.maxChars;
    this.autoCompile = options.autoCompile;
    this.files = [];
    this.importList = this.createImportList(options.target, options.result);
    this.createdFiles = [];
    this.autoCompile = options.autoCompile;
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
      const ingameFilepath = createBasePath(rootTarget, target, '');

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
      's = get_shell',
      'c = s.host_computer',
      'm = function(filePath, content, isNew)',
      '	segments = filePath.split("/")[1 : ]',
      '	fileName = segments.pop',
      '	for segment in segments',
      '		parentPath = "/" + segments[ : __segment_idx].join("/")',
      '		folderName = segment',
      '		if parentPath == "/" then',
      '			folderPath = "/" + folderName',
      '		else',
      '			folderPath = parentPath + "/" + folderName',
      '		end if',
      '		folderHandle = c.File(folderPath)',
      '		if folderHandle == null then',
      '			result = c.create_folder(parentPath, folderName) == 1',
      '			if result != 1 then exit("Could not create folder in """ + folderPath + """ due to: " + result)',
      '			print("New folder """ + folderPath + """ got created.")',
      '			folderHandle = c.File(folderPath)',
      '		end if',
      '		if not folderHandle.is_folder then exit("Entity at """ + folderPath + """ is not a folder. Installation got aborted.")',
      '	end for',
      '	parentPath = "/" + segments.join("/")',
      '	fileEntity = c.File(filePath)',
      '	if fileEntity == null then',
      '		result = c.touch(parentPath, fileName)',
      '		if result != 1 then exit("Could not create file in """ + filePath + """ due to: " + result)',
      '		fileEntity = c.File(filePath)',
      '	end if',
      '	if fileEntity == null then exit("Unable to get file at """ + filePath + """. Installation got aborted.")',
      '	if fileEntity.is_folder then exit("File at """ + filePath + """ is a folder but should be a source file. Installation got aborted.")',
      '	if fileEntity.is_binary then exit("File at """ + filePath + """ is a binary but should be a source file. Installation got aborted.")',
      '	if isNew then',
      '		fileEntity.set_content(content)',
      '		print("New file """ + filePath + """ got created.")',
      '	else',
      '		fileEntity.set_content(fileEntity.get_content + content)',
      '		print("Content got appended to """ + filePath + """.")',
      '	end if',
      'end function',
      'd = function',
      '	c.File(program_path).delete',
      'end function',
      ''
    ]
      .map((line) => line.trim())
      .join(';');
  }

  createContentFooterAutoCompile(): string[] {
    if (this.autoCompile.enabled) {
      const rootRef = this.importList.find(
        (item) => item.filepath === this.target
      );

      return generateAutoCompileCode({
        rootDirectory: this.ingameDirectory,
        rootFilePath: rootRef.ingameFilepath,
        importPaths: this.importList.map((it) => it.ingameFilepath),
        purge: this.autoCompile.purge,
        binaryName: this.autoCompile.binaryName
      }).split(';');
    }

    return [];
  }

  createContentFooter(): string {
    return ['d', ...this.createContentFooterAutoCompile(), ''].join(';');
  }

  async build() {
    let file = new InstallerFile({
      rootDirectory: this.ingameDirectory,
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
            rootDirectory: this.ingameDirectory,
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
        rootDirectory: this.ingameDirectory,
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
