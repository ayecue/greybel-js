import { crlf, LF } from 'crlf-normalize';
import { DefaultResourceHandler as DefaultInterpreterResourceHandler } from 'greybel-interpreter';
import {
  ResourceHandler as TranspilerResourceHandler,
  ResourceProvider as TranspilerResourceProviderBase
} from 'greybel-transpiler';
import { DocumentURIBuilder } from './document-uri-builder.js';
import path from 'path';

const createDocumentUriBuilder = (source: string) => {
  return new DocumentURIBuilder(path.resolve(source, '..'));
};

export class TranspilerResourceProvider extends TranspilerResourceProviderBase {
  getHandler(): TranspilerResourceHandler {
    const handler = super.getHandler();

    return {
      ...handler,
      getTargetRelativeTo: async (source, target) => {
        const documentUriBuilder = createDocumentUriBuilder(source);
        const result = await documentUriBuilder.getPathUseReturnOriginal(target);
        return result.toString();
      },
      get: async (target: string): Promise<string> => {
        const content = await handler.get(target);
        return crlf(content, LF);
      }
    };
  }
}

export class InterpreterResourceProvider extends DefaultInterpreterResourceHandler {
  async getTargetRelativeTo(source, target) {
    const documentUriBuilder = createDocumentUriBuilder(source);
    const result = await documentUriBuilder.getPathUseReturnOriginal(target);
    return result.toString();
  }

  async get(target: string): Promise<string> {
    const content = await super.get(target);
    return crlf(content, LF);
  }
}
