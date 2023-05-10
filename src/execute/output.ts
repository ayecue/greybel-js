import { AnotherAnsiProvider, ModifierType } from 'another-ansi';
import cliProgress from 'cli-progress';
import cssColorNames from 'css-color-names/css-color-names.json' assert { type: 'json' };
import { KeyEvent, OutputHandler, PrintOptions } from 'greybel-interpreter';
import readline from 'readline';
import { Tag, TagRecord, transform } from 'text-mesh-transformer';

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

export function wrapWithTag(openTag: TagRecord, content: string): string {
  switch (openTag.tag) {
    case Tag.Color:
      return useColor(openTag.value, content);
    case Tag.Underline:
      return ansiProvider.modify(ModifierType.Underline, content);
    case Tag.Italic:
      return ansiProvider.modify(ModifierType.Italic, content);
    case Tag.Bold:
      return ansiProvider.modify(ModifierType.Bold, content);
    case Tag.Strikethrough:
      return ansiProvider.modify(ModifierType.Strikethrough, content);
    case Tag.Mark:
      return useBgColor(openTag.value, content);
    case Tag.Lowercase:
      return content.toLowerCase();
    case Tag.Uppercase:
      return content.toLowerCase();
  }

  if (openTag.value) {
    return `<${openTag.tag}=${openTag.value}>${content}</${openTag.tag}>`;
  }

  return `<${openTag.tag}>${content}</${openTag.tag}>`;
}

export default class CLIOutputHandler extends OutputHandler {
  print(message: string, { appendNewLine = true, replace = false }: Partial<PrintOptions> = {}) {
    const transformed = transform(
      message,
      (openTag: TagRecord, content: string): string => {
        return wrapWithTag(openTag, content);
      }
    ).replace(/\\n/g, '\n');

    if (replace) {
      process.stdout.write('\u001B[1A' + transformed + '\n');
    } else if (appendNewLine) {
      process.stdout.write(transformed + '\n');
    } else {
      process.stdout.write(transformed);
    }
  }

  clear() {
    console.clear();
  }

  progress(timeout: number): Promise<void> {
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
      const interval = setInterval(() => {
        const currentTime = Date.now();
        const elapsed = currentTime - startTime;

        if (elapsed > timeout) {
          loadingBar.update(timeout);
          clearInterval(interval);
          loadingBar.stop();
          resolve();
          return;
        }

        loadingBar.update(elapsed);
      });
    });
  }

  waitForInput(isPassword: boolean, message: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const transformed = transform(
        message,
        (openTag: TagRecord, content: string): string => {
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

  waitForKeyPress(message: string): Promise<KeyEvent> {
    return new Promise((resolve, _reject) => {
      this.print(message, {
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
          process.stdin.pause();
          resolve(nodeJSKeyEventToKeyEvent(key));
        }
      );
    });
  }
}
