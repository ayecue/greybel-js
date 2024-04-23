import { crlf, LF } from 'crlf-normalize';
import { DefaultResourceHandler as DefaultInterpreterResourceHandler } from 'greybel-interpreter';

export class InterpreterResourceProvider extends DefaultInterpreterResourceHandler {
  async get(target: string): Promise<string> {
    const content = await super.get(target);
    return crlf(content, LF);
  }
}
