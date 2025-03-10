import fs from 'fs/promises';
import { TranspilerParseResult } from 'greybel-transpiler';
import { mkdirpNative } from 'mkdirp';
import path from 'path';

import { createBasePath } from './create-base-path.js';

export const createParseResult = async (
  rootDir: string,
  buildPath: string,
  result: TranspilerParseResult
): Promise<void> => {
  const relativePathFactory: (filePath: string) => string = (
    filePath: string
  ) => createBasePath(rootDir, filePath);

  await Promise.all(
    Object.entries(result).map(async ([file, code]) => {
      const relativePath = relativePathFactory(file);
      const fullPath = path.resolve(buildPath, relativePath);
      await mkdirpNative(path.dirname(fullPath));
      await fs.writeFile(fullPath, code, { encoding: 'utf-8' });
    })
  );
};
