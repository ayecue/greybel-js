import { ResourceHandler } from 'greybel-interpreter';

export class PseudoResourceHandler extends ResourceHandler {
  private code: string;

  constructor(code: string) {
    super();
    this.code = code;
  }

  getTargetRelativeTo(_source: string, _target: string): Promise<string> {
    return Promise.reject(new Error('Cannot get relative files in web.'));
  }

  has(target: string): Promise<boolean> {
    return Promise.resolve(target === 'default');
  }

  get(target: string): Promise<string> {
    return Promise.resolve(target === 'default' ? this.code : '');
  }

  resolve(target: string): Promise<string> {
    return Promise.resolve(target === 'default' ? 'default' : '');
  }
}
