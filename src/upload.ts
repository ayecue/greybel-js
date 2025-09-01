import { ModifierType } from 'another-ansi';
import fs from 'fs/promises';
import { glob } from 'glob';
import path from 'path';

import { executeImport } from './build/importer.js';
import { ansiProvider, useColor } from './execute/output.js';
import { logger } from './helper/logger.js';
import { VersionManager } from './helper/version-manager.js';
import { parseUploadOptions, UploadOptions } from './upload/types.js';
import { randomString } from './helper/random-string.js';

const getFiles = async (target: string): Promise<string[]> => {
  const stat = await fs.stat(target);

  if (stat.isDirectory()) {
    return await glob('**/*', {
      cwd: target,
      absolute: true,
      nodir: true
    });
  } else if (stat.isFile()) {
    return [target];
  }

  return [];
};

export default async function upload(
  targetpath: string,
  options: Partial<UploadOptions> = {}
): Promise<boolean> {
  const uploadOptions: UploadOptions = parseUploadOptions(options);

  try {
    const target = path.resolve(targetpath);
    const files = await getFiles(target);

    if (files.length === 0) {
      logger.warn(useColor('yellow', 'No files found!'));
      return;
    }

    const ingameDirectory = uploadOptions.ingameDirectory;
    const resourceDirectory = path.posix.join(ingameDirectory, randomString(5));
    const filesWithContent = await Promise.all(
      files.map(async (filepath) => {
        const content = await fs.readFile(filepath, { encoding: 'utf-8' });

        return {
          path: filepath,
          content
        };
      })
    );

    await executeImport({
      rootDir: path.dirname(target),
      rootPaths: [],
      ingameDirectory: ingameDirectory.replace(/\/$/i, ''),
      resourceDirectory,
      result: filesWithContent.reduce((result, item) => {
        result[item.path] = item.content;
        return result;
      }, {}),
      port: options.port,
      autoCompile: {
        enabled: false,
        allowImport: false
      }
    });

    await VersionManager.triggerContextAgentHealthcheck();

    logger.debug(`Import done. Files available in ${ingameDirectory}.`);
  } catch (err: any) {
    logger.error(
      useColor(
        'red',
        `${ansiProvider.modify(ModifierType.Bold, 'Unexpected error')}: ${
          err.message
        }\n${err.stack}`
      )
    );

    return false;
  }

  return true;
}
