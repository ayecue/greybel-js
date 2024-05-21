import { KeyCode } from 'greybel-gh-mock-intrinsics';
import {
  KeyEvent,
  OutputHandler,
  PrintOptions,
  UpdateOptions,
  VM
} from 'greybel-interpreter';

import { Stdin } from '../std/stdin.js';
import { StdoutCanvas, StdoutText } from '../std/stdout.js';
import { transform } from './output/transform.js';

export interface WebOutputHandlerOptions {
  stdin: Stdin;
  stdoutCanvas: StdoutCanvas;
  stdoutText: StdoutText;
}

export class WebOutputHandler extends OutputHandler {
  private stdin: Stdin;
  private stdoutCanvas: StdoutCanvas;
  private stdoutText: StdoutText;

  constructor(options: WebOutputHandlerOptions) {
    super();
    this.stdin = options.stdin;
    this.stdoutCanvas = options.stdoutCanvas;
    this.stdoutText = options.stdoutText;
  }

  private processLine(text: string): string {
    return transform(text).replace(/\\n/g, '\n');
  }

  print(
    _vm: VM,
    message: string,
    { appendNewLine = true, replace = false }: Partial<PrintOptions> = {}
  ) {
    this.stdoutCanvas.print(message, { appendNewLine, replace });
    const transformed = this.processLine(message);

    if (replace) {
      this.stdoutText.replace(transformed + '\n');
    } else if (appendNewLine) {
      this.stdoutText.write(transformed + '\n');
    } else {
      this.stdoutText.write(transformed);
    }
  }

  update(
    _vm: VM,
    message: string,
    { appendNewLine = false, replace = false }: Partial<UpdateOptions> = {}
  ) {
    const transformed = this.processLine(message);

    if (replace) {
      this.stdoutCanvas.updateLast(message);
      this.stdoutText.updateLast(transformed + (appendNewLine ? '\n' : ''));
    } else {
      this.stdoutCanvas.write(message);
      this.stdoutText.write(transformed + (appendNewLine ? '\n' : ''));
    }
  }

  clear() {
    this.stdoutCanvas.clear();
    this.stdoutText.clear();
  }

  progress(vm: VM, timeout: number): Promise<void> {
    const startTime = Date.now();
    const max = 20;

    this.stdoutCanvas.print(`[${'-'.repeat(max)}]`);
    this.stdoutText.write(`[${'-'.repeat(max)}]`);

    return new Promise((resolve, _reject) => {
      const onExit = () => {
        clearInterval(interval);
        resolve();
      };
      const interval = setInterval(() => {
        const currentTime = Date.now();
        const elapsed = currentTime - startTime;

        if (elapsed > timeout) {
          this.stdoutCanvas.updateLast(`[${'#'.repeat(max)}]`);
          this.stdoutCanvas.write(`\n`);
          this.stdoutText.updateLast(`[${'#'.repeat(max)}]`);
          this.stdoutText.write('\n');
          vm.getSignal().removeListener('exit', onExit);
          clearInterval(interval);
          resolve();
          return;
        }

        const elapsedPercentage = (100 * elapsed) / timeout;
        const progress = Math.floor((elapsedPercentage * max) / 100);
        const right = max - progress;

        this.stdoutCanvas.updateLast(
          `[${'#'.repeat(progress)}${'-'.repeat(right)}]`
        );
        this.stdoutText.updateLast(
          `[${'#'.repeat(progress)}${'-'.repeat(right)}]`
        );
      });

      vm.getSignal().once('exit', onExit);
    });
  }

  waitForInput(vm: VM, isPassword: boolean, message: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const transformed = this.processLine(message);

      this.stdoutCanvas.input(message);
      this.stdoutText.write(transformed + '\n');

      this.stdin.enable();
      this.stdin.focus();
      this.stdin.setType(isPassword ? 'password' : 'text');

      return this.stdin
        .waitForInput(vm)
        .then(() => {
          const value = this.stdin.getValue();

          return resolve(value);
        })
        .catch(reject)
        .finally(() => {
          this.stdin.clear();
          this.stdin.disable();
          this.stdin.setType('text');
        });
    });
  }

  waitForKeyPress(vm: VM, message: string): Promise<KeyEvent> {
    return new Promise((resolve, reject) => {
      const transformed = this.processLine(message);

      this.stdoutCanvas.input(message);
      this.stdoutText.write(transformed);

      this.stdin.enable();
      this.stdin.focus();

      return this.stdin
        .waitForKeyPress(vm)
        .then((keyEvent) => {
          if (KeyCode[keyEvent.keyCode]) {
            return resolve({
              keyCode: keyEvent.keyCode,
              code: keyEvent.code
            });
          }

          return resolve({
            charCode: keyEvent.key.charCodeAt(0),
            code: keyEvent.code
          });
        })
        .catch(reject)
        .finally(() => {
          this.stdin.clear();
          this.stdin.disable();
        });
    });
  }
}
