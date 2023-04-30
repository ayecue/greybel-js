import { input, password } from '@inquirer/prompts';
import { default as ansis } from 'ansis';
import cliProgress from 'cli-progress';
import cssColorNames from 'css-color-names/css-color-names.json' assert { type: 'json' };
import { KeyEvent, OutputHandler } from 'greybel-interpreter';
import readline from 'readline';
import { Tag, TagRecord, transform } from 'text-mesh-transformer';

import { NodeJSKeyEvent, nodeJSKeyEventToKeyEvent } from './key-event.js';

const hasOwnProperty = Object.prototype.hasOwnProperty;

function useColor(color: string | undefined, content: string): string {
  if (!color) return content;

  const cssColorMap = cssColorNames as { [key: string]: string };

  if (hasOwnProperty.call(cssColorMap, color)) {
    const item = cssColorMap[color];
    color = item;
  }

  return ansis.hex(color)(content);
}

function useBgColor(color: string | undefined, content: string): string {
  if (!color) return content;

  const cssColorMap = cssColorNames as { [key: string]: string };

  if (hasOwnProperty.call(cssColorMap, color)) {
    const item = cssColorMap[color];
    color = item;
  }

  return ansis.bgHex(color)(content);
}

function wrapWithTag(openTag: TagRecord, content: string): string {
  switch (openTag.tag) {
    case Tag.Color:
      return useColor(openTag.value, content);
    case Tag.Underline:
      return ansis.underline(content);
    case Tag.Italic:
      return ansis.italic(content);
    case Tag.Bold:
      return ansis.bold(content);
    case Tag.Strikethrough:
      return ansis.strikethrough(content);
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
  print(message: string, appendNewLine: boolean = true) {
    const transformed = transform(
      message,
      (openTag: TagRecord, content: string): string => {
        return wrapWithTag(openTag, content);
      }
    ).replace(/\\n/g, '\n');

    if (appendNewLine) {
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

  waitForInput(isPassword: boolean): Promise<string> {
    return new Promise((resolve, reject) => {
      if (isPassword) {
        return password({
          message: '¶'
        })
          .then(resolve)
          .catch(reject);
      }

      return input({
        message: '¶'
      })
        .then(resolve)
        .catch(reject);
    });
  }

  waitForKeyPress(): Promise<KeyEvent> {
    return new Promise((resolve, _reject) => {
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
