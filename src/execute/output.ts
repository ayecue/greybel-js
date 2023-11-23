import { AnotherAnsiProvider, ModifierType } from 'another-ansi';
import ansiEscapes from 'ansi-escapes';
import cliProgress from 'cli-progress';
import cssColorNames from 'css-color-names/css-color-names.json' assert { type: 'json' };
import { KeyEvent, OutputHandler, PrintOptions, VM } from 'greybel-interpreter';
import readline from 'readline';
import { Tag, TagRecordOpen, transform } from 'text-mesh-transformer';

import { NodeJSKeyEvent, nodeJSKeyEventToKeyEvent } from './key-event.js';
import { customInput as input, customPassword as password } from './prompts.js';

export const ansiProvider = new AnotherAnsiProvider();
const hasOwnProperty = Object.prototype.hasOwnProperty;

export function useColor(color: string | undefined, content: string): string {
  if (!color) return content;

  const cssColorMap = cssColorNames as { [key: string]: string };

  if (hasOwnProperty.call(cssColorMap, color)) {
    const item = cssColorMap[color];
    color = item;
  }

  return ansiProvider.colorWithHex(color, content);
}

export function useBgColor(color: string | undefined, content: string): string {
  if (!color) return content;

  const cssColorMap = cssColorNames as { [key: string]: string };

  if (hasOwnProperty.call(cssColorMap, color)) {
    const item = cssColorMap[color];
    color = item;
  }

  return ansiProvider.bgColorWithHex(color, content);
}

export function wrapWithTag(openTag: TagRecordOpen, content: string): string {
  switch (openTag.type) {
    case Tag.Color:
      return useColor(openTag.attributes.value, content);
    case Tag.Underline:
      return ansiProvider.modify(ModifierType.Underline, content);
    case Tag.Italic:
      return ansiProvider.modify(ModifierType.Italic, content);
    case Tag.Bold:
      return ansiProvider.modify(ModifierType.Bold, content);
    case Tag.Strikethrough:
      return ansiProvider.modify(ModifierType.Strikethrough, content);
    case Tag.Mark:
      return useBgColor(openTag.attributes.value, content);
    case Tag.Lowercase:
      return content.toLowerCase();
    case Tag.Uppercase:
      return content.toLowerCase();
  }

  if (openTag.attributes.value) {
    return `<${openTag.type}=${openTag.attributes.value}>${content}</${openTag.type}>`;
  }

  return `<${openTag.type}>${content}</${openTag.type}>`;
}

export default class CLIOutputHandler extends OutputHandler {
  previousLinesCount: number;

  constructor() {
    super();
    this.previousLinesCount = 0;
  }

  print(
    _vm: VM,
    message: string,
    { appendNewLine = true, replace = false }: Partial<PrintOptions> = {}
  ) {
    const transformed = transform(
      message,
      (openTag: TagRecordOpen, content: string): string => {
        return wrapWithTag(openTag, content);
      }
    ).replace(/\\n/g, '\n');

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
      console.warn(
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
        console.warn(
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
