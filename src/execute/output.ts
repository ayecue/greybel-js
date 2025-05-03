import { AnotherAnsiProvider, ModifierType } from 'another-ansi';
import ansiEscapes from 'ansi-escapes';
import cliProgress from 'cli-progress';
import EventEmitter from 'node:events';
import { createRequire } from 'node:module';
import readline from 'readline';
import { Tag, TagRecordOpen, transform } from 'text-mesh-transformer';

import { logger } from '../helper/logger.js';
import {
  customInput as input,
  customPassword as password
} from '../helper/prompts.js';
import { NodeJSKeyEvent } from './key-event.js';

// revisit once import type { 'json' } is supported by lts
const require = createRequire(import.meta.url);
const cssColorNames = require('css-color-names/css-color-names.json');

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

export interface InputOptions {
  appendNewLine: boolean;
  replace: boolean;
}

export class Terminal {
  previousLinesCount: number;

  constructor() {
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
    message: string,
    { appendNewLine = true, replace = false }: Partial<InputOptions> = {}
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
    message: string,
    { appendNewLine = false, replace = false }: Partial<InputOptions> = {}
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

  clear() {
    console.clear();
  }

  progress(ev: EventEmitter, timeout: number): Promise<void> {
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
          ev.removeListener('exit', onExit);
          clearInterval(interval);
          loadingBar.stop();
          resolve();
          return;
        }

        loadingBar.update(elapsed);
      });

      ev.once('exit', onExit);
    });
  }

  waitForInput(isPassword: boolean, message: string): Promise<string> {
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

  waitForKeyPress(
    message: string,
    onExit: () => void
  ): Promise<NodeJSKeyEvent> {
    return new Promise((resolve, _reject) => {
      this.print(message, {
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
            onExit();
          }

          process.stdin.pause();
          resolve(key);
        }
      );
    });
  }
}
