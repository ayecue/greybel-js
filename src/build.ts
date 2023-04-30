import fs from 'fs/promises';
import {
  BuildType,
  Transpiler,
  TranspilerParseResult
} from 'greybel-transpiler';
import mkdirp from 'mkdirp';
import path from 'path';

import EnvMapper from './build/env-mapper.js';

function createContentHeader(): string {
  return ['s=get_shell', 'c=s.host_computer', 'h=home_dir', 'p=@push'].join(
    '\n'
  );
}

function isRootDirectory(target: string): boolean {
  return /^(\.|\/)$/.test(target);
}

function createFolderLine(folder: string): string[] {
  const parent = path.dirname(folder);
  const target = path.basename(folder);
  let output: string[] = [];

  if (isRootDirectory(target)) {
    return output;
  }

  if (isRootDirectory(parent)) {
    output = output.concat([
      'd=c.File(h+"/' + target + '")',
      'if (d == null) then c.create_folder(h,"/' + target + '")'
    ]);
  } else {
    output = output.concat([
      'd=c.File(h+"' + parent + '/' + target + '")',
      'if (d == null) then c.create_folder(h+"' +
        parent +
        '","/' +
        target +
        '")'
    ]);
  }

  return output;
}

function createFileLine(file: string, isNew?: boolean): string {
  const base = path.basename(file);
  const folder = path.dirname(file);
  let output = createFolderLine(folder);

  if (isNew) {
    if (isRootDirectory(folder)) {
      output = output.concat([
        'print("Creating "+h+"/' + base + '")',
        'c.touch(h,"' + base + '")',
        'f=c.File(h+"/' + base + '")',
        'l=[]'
      ]);
    } else {
      output = output.concat([
        'print("Creating "+h+"' + folder + '/' + base + '")',
        'c.touch(h+"' + folder + '","' + base + '")',
        'f=c.File(h+"' + folder + '/' + base + '")',
        'l=[]'
      ]);
    }
  } else {
    if (isRootDirectory(folder)) {
      output = output.concat([
        'f=c.File(h+"/' + base + '")',
        'if (f == null) then',
        'c.touch(h,"' + base + '")',
        'f=c.File(h+"/' + base + '")',
        'end if',
        'l=f.get_content.split(char(10))'
      ]);
    } else {
      output = output.concat([
        'f=c.File(h+"' + folder + '/' + base + '")',
        'if (f == null) then',
        'c.touch(h+"' + folder + '", "' + base + '")',
        'f=c.File(h+"' + folder + '/' + base + '")',
        'end if',
        'l=f.get_content.split(char(10))'
      ]);
    }
  }

  return output.join('\n');
}

function createCodeInsertLine(line: string): string {
  const parsed = line
    .replace(/"/g, '""')
    .replace(/^import_code\(/i, 'import"+"_"+"code(');

  return 'p(l,"' + parsed + '")';
}

function createSetContentLine(): string {
  return 'f.set_content(l.join(char(10)))';
}

function createImportList(
  parseResult: TranspilerParseResult,
  mainTarget: string
): any[] {
  const pseudoRoot = path.dirname(mainTarget) || '';
  const imports = Object.entries(parseResult).map(([target, code]) => {
    return {
      filepath: target,
      pseudoFilepath: target.replace(pseudoRoot, '').replace(path.sep, '/'),
      content: code
    };
  });

  return imports;
}

async function createInstaller(
  parseResult: TranspilerParseResult,
  mainTarget: string,
  buildPath: string,
  maxWords: number
): Promise<void> {
  const importList = createImportList(parseResult, mainTarget);
  const maxWordsWithBuffer = maxWords - 1000;
  let installerSplits = 0;
  let content = createContentHeader();
  let item = importList.shift();
  const createInstallerFile = async () => {
    if (content.length === 0) {
      return;
    }

    const target = path.resolve(
      buildPath,
      'installer' + installerSplits + '.src'
    );

    await fs.writeFile(target, content, { encoding: 'utf-8' });

    installerSplits++;
  };
  const openFile = async (file: string) => {
    const preparedLine = '\n' + createFileLine(file, true);
    const newContent = content + preparedLine;

    if (newContent.length > maxWordsWithBuffer) {
      await createInstallerFile();
      content = createContentHeader() + '\n' + createFileLine(file, true);
    } else {
      content = newContent;
    }
  };
  const addLine = async (file: string, line: string) => {
    const preparedLine = '\n' + createCodeInsertLine(line);
    const newContent = content + preparedLine;

    if (newContent.length > maxWordsWithBuffer) {
      content += '\n' + createSetContentLine();
      await createInstallerFile();
      content = createContentHeader() + '\n' + createFileLine(file);
      await addLine(file, line);
    } else {
      content = newContent;
    }
  };

  while (item) {
    const lines = item.content.split('\n');
    let line = lines.shift();

    await openFile(item.pseudoFilepath);

    while (line !== undefined) {
      await addLine(item.pseudoFilepath, line);
      line = lines.shift();
    }

    content += '\n' + createSetContentLine();

    item = importList.shift();
  }

  await createInstallerFile();
}

export interface BuildOptions {
  uglify: boolean;
  beautify: boolean;
  obfuscation: boolean;
  installer: boolean;
  excludedNamespaces: string[];
  disableLiteralsOptimization: boolean;
  disableNamespacesOptimization: boolean;
  envFiles: string[];
  envVars: string[];
  maxChars: number;
}

export default async function build(
  filepath: string,
  output: string,
  options: Partial<BuildOptions> = {}
): Promise<boolean> {
  const envMapper = new EnvMapper();
  const buildOptions: BuildOptions = {
    uglify: options.uglify || false,
    beautify: options.beautify || false,
    obfuscation: options.obfuscation || false,
    installer: options.installer || false,
    excludedNamespaces: options.excludedNamespaces || [],
    disableLiteralsOptimization: options.disableLiteralsOptimization || false,
    disableNamespacesOptimization:
      options.disableNamespacesOptimization || false,
    maxChars: options.maxChars || 155000,
    envFiles: options.envFiles || [],
    envVars: options.envVars || []
  };
  let buildType = BuildType.DEFAULT;

  envMapper.load(buildOptions.envFiles, buildOptions.envVars);

  if (buildOptions.uglify) {
    buildType = BuildType.UGLIFY;
  } else if (buildOptions.beautify) {
    buildType = BuildType.BEAUTIFY;
  }

  try {
    const target = path.resolve(filepath);
    const result = await new Transpiler({
      target,
      buildType,
      obfuscation: buildOptions.obfuscation,
      excludedNamespaces: buildOptions.excludedNamespaces,
      disableLiteralsOptimization: buildOptions.disableLiteralsOptimization,
      disableNamespacesOptimization: buildOptions.disableNamespacesOptimization,
      environmentVariables: new Map(Object.entries(envMapper.map))
    }).parse();

    const buildPath = path.resolve(output, './build');
    const targetRootSegments = path.dirname(target).split(path.sep);

    try {
      await fs.rm(buildPath, {
        recursive: true
      });
    } catch (err) {}

    await mkdirp(buildPath);

    const getRelativePath = (filePath: string) => {
      const pathSegments = filePath.split(path.sep);
      const filtered: string[] = [];

      for (const segment of targetRootSegments) {
        const current = pathSegments.shift();

        if (current !== segment) {
          break;
        }

        filtered.push(current);
      }

      let relativePath = filePath.replace(`${path.join(...filtered)}`, '.');

      if (relativePath.startsWith(path.sep)) {
        relativePath = relativePath.slice(1);
      }

      return relativePath;
    };

    await Promise.all(
      Object.entries(result).map(async ([file, code]) => {
        const relativePath = getRelativePath(file);
        const fullPath = path.resolve(buildPath, relativePath);
        await mkdirp(path.dirname(fullPath));
        await fs.writeFile(fullPath, code, { encoding: 'utf-8' });
      })
    );

    if (buildOptions.installer) {
      await createInstaller(result, target, buildPath, buildOptions.maxChars);
    }

    console.log(`Build done. Available in ${buildPath}.`);
  } catch (err: any) {
    console.error(err.message);
    return false;
  }

  return true;
}
