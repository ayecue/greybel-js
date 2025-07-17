import { crlf, LF } from 'crlf-normalize';
import { DefaultResourceHandler as DefaultInterpreterResourceHandler } from 'greybel-interpreter';
import {
  ResourceHandler as TranspilerResourceHandler,
  ResourceProvider as TranspilerResourceProviderBase
} from 'greybel-transpiler';
import path from 'path';

import { DocumentURIBuilder } from './document-uri-builder.js';
import { FileSystemManager, FileSystemManagerWithCache } from './fs.js';

const createDocumentUriBuilder = (
  source: string,
  fileSystemManager?: FileSystemManager
) => {
  return new DocumentURIBuilder(path.resolve(source, '..'), fileSystemManager);
};

export class TranspilerResourceProvider extends TranspilerResourceProviderBase {
  getHandler(): TranspilerResourceHandler {
    const handler = super.getHandler();
    const fileSystemManager = new FileSystemManagerWithCache();

    return {
      ...handler,
      getTargetRelativeTo: async (source, target) => {
        const documentUriBuilder = createDocumentUriBuilder(
          source,
          fileSystemManager
        );
        const result = await documentUriBuilder.getPathUseReturnOriginal(
          target
        );
        return result;
      },
      has: async (target: string): Promise<boolean> => {
        return await fileSystemManager.checkFileExists(target);
      },
      get: async (target: string): Promise<string> => {
        return await fileSystemManager.tryToDecode(target);
      }
    };
  }
}

export class InterpreterResourceProvider extends DefaultInterpreterResourceHandler {
  private fileSystemManager: FileSystemManager;

  constructor() {
    super();
    this.fileSystemManager = new FileSystemManagerWithCache();
  }

  async getTargetRelativeTo(source, target) {
    const documentUriBuilder = createDocumentUriBuilder(
      source,
      this.fileSystemManager
    );
    const result = await documentUriBuilder.getPathUseReturnOriginal(target);
    return result.toString();
  }

  async has(target: string): Promise<boolean> {
    return await this.fileSystemManager.checkFileExists(target);
  }

  async get(target: string): Promise<string> {
    return await this.fileSystemManager.tryToDecode(target);
  }
}
