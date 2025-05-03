import { AnotherAnsiProvider, ModifierType } from 'another-ansi';
import ansiEscapes from 'ansi-escapes';
import cliProgress from 'cli-progress';
import {
  KeyEvent,
  OutputHandler,
  PrintOptions,
  UpdateOptions,
  VM
} from 'greybel-interpreter';
import readline from 'readline';
import { TagRecordOpen, transform } from 'text-mesh-transformer';

import { logger } from '../../helper/logger.js';
import {
  customInput as input,
  customPassword as password
} from '../../helper/prompts.js';
import { NodeJSKeyEvent, nodeJSKeyEventToKeyEvent } from '../key-event.js';
import { wrapWithTag } from '../output.js';

export default class CLIOutputHandler extends OutputHandler {
  previousLinesCount: number;

  constructor() {
    super();
    this.previousLinesCount = 0;
  }

  private processLine(text: string): string {
    return transform(
      text,
      (openTag: TagRecordOpen, content: string): string => {
        return wrapWithTag(openTag, content);
      }
    ).replace(/\\n/g, '\n');
  }

  print(
    _vm: VM,
    message: string,
    { appendNewLine = true, replace = false }: Partial<PrintOptions> = {}
  ) {
    const transformed = this.processLine(message);

    if (replace) {
      process.stdout.write(ansiEscapes.eraseLines(this.previousLinesCount));
      this.previousLinesCount = 0;
    }

    this.previousLinesCount += transformed.split('\n').length;

    if (appendNewLine) {
      process.stdout.write(transformed + '\n');
      this.previousLinesCount++;
    } else {
      process.stdout.write(transformed);
    }
  }

  update(
    _vm: VM,
    message: string,
    { appendNewLine = false, replace = false }: Partial<UpdateOptions> = {}
  ) {
    const transformed = this.processLine(message);

    if (replace) {
      process.stdout.write(ansiEscapes.eraseLines(1));
    }

    this.previousLinesCount += transformed.split('\n').length - 1;

    if (appendNewLine) {
      process.stdout.write(transformed + '\n');
      this.previousLinesCount++;
    } else {
      process.stdout.write(transformed);
    }
  }

  clear(_vm: VM) {
    console.clear();
  }

  progress(vm: VM, timeout: number): Promise<void> {
    const startTime = Date.now();
    const loadingBar = new cliProgress.SingleBar(
      {},
      cliProgress.Presets.shades_classic
    );
    loadingBar.start(timeout, 0);

    if (!process.stdin.isTTY) {
      logger.warn(
        'Stdin TTY is false. Therefore the progress bar cannot be shown.'
      );
    }

    return new Promise((resolve, _reject) => {
      const onExit = () => {
        clearInterval(interval);
        loadingBar.stop();
        resolve();
      };
      const interval = setInterval(() => {
        const currentTime = Date.now();
        const elapsed = currentTime - startTime;

        if (elapsed > timeout) {
          loadingBar.update(timeout);
          vm.getSignal().removeListener('exit', onExit);
          clearInterval(interval);
          loadingBar.stop();
          resolve();
          return;
        }

        loadingBar.update(elapsed);
      });

      vm.getSignal().once('exit', onExit);
    });
  }

  waitForInput(_vm: VM, isPassword: boolean, message: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const transformed = transform(
        message,
        (openTag: TagRecordOpen, content: string): string => {
          return wrapWithTag(openTag, content);
        }
      ).replace(/\\n/g, '\n');

      if (isPassword) {
        return password({
          message: transformed
        })
          .then(resolve)
          .catch(reject);
      }

      return input({
        message: transformed
      })
        .then(resolve)
        .catch(reject);
    });
  }

  waitForKeyPress(vm: VM, message: string): Promise<KeyEvent> {
    return new Promise((resolve, _reject) => {
      this.print(vm, message, {
        appendNewLine: false
      });

      readline.emitKeypressEvents(process.stdin);

      process.stdin.resume();

      if (process.stdin.isTTY) {
        process.stdin.setRawMode(true);
      } else {
        logger.warn(
          "Stdin TTY is false. Therefore anyKey isn't able to detect any input. Press enter to continue."
        );
      }

      process.stdin.once(
        'keypress',
        (_character: string, key: NodeJSKeyEvent) => {
          if (key.ctrl && key.name === 'c') {
            vm.exit();
          }

          process.stdin.pause();
          resolve(nodeJSKeyEventToKeyEvent(key));
        }
      );
    });
  }
}
