import fs from 'fs/promises';
import { TranspilerParseResult } from 'greybel-transpiler';
import mkdirp from 'mkdirp';
import path from 'path';

const createRelativePath = (
  targetRootSegments: string[],
  filePath: string
): string => {
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

export const createParseResult = async (
  target: string,
  buildPath: string,
  result: TranspilerParseResult
): Promise<void> => {
  const targetRootSegments = path.dirname(target).split(path.sep);
  const relativePathFactory: (filePath: string) => string =
    createRelativePath.bind(null, targetRootSegments);

  await Promise.all(
    Object.entries(result).map(async ([file, code]) => {
      const relativePath = relativePathFactory(file);
      const fullPath = path.resolve(buildPath, relativePath);
      await mkdirp(path.dirname(fullPath));
      await fs.writeFile(fullPath, code, { encoding: 'utf-8' });
    })
  );
};
