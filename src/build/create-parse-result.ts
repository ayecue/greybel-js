import fs from 'fs/promises';
import { TranspilerParseResult } from 'greybel-transpiler';
import mkdirp from 'mkdirp';
import path from 'path';

import { createBasePath } from './create-base-path.js';

export const createParseResult = async (
  target: string,
  buildPath: string,
  result: TranspilerParseResult
): Promise<void> => {
  const relativePathFactory: (filePath: string) => string = (
    filePath: string
  ) => createBasePath(target, filePath);

  await Promise.all(
    Object.entries(result).map(async ([file, code]) => {
      const relativePath = relativePathFactory(file);
      const fullPath = path.resolve(buildPath, relativePath);
      await mkdirp(path.dirname(fullPath));
      await fs.writeFile(fullPath, code, { encoding: 'utf-8' });
    })
  );
};
