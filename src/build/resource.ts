import { crlf, LF } from 'crlf-normalize';
import {
  ResourceHandler as TranspilerResourceHandler,
  ResourceProvider as TranspilerResourceProviderBase
} from 'greybel-transpiler';

export class TranspilerResourceProvider extends TranspilerResourceProviderBase {
  getHandler(): TranspilerResourceHandler {
    const handler = super.getHandler();

    return {
      ...handler,
      get: async (target: string): Promise<string> => {
        const content = await handler.get(target);
        return crlf(content, LF);
      }
    };
  }
}
