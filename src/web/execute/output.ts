import { KeyCode } from 'greybel-gh-mock-intrinsics';
import { KeyEvent, OutputHandler, PrintOptions, VM } from 'greybel-interpreter';
import { Tag, TagRecordOpen, transform } from 'text-mesh-transformer';

import { Stdin, Stdout } from '../std.js';

function parsePixelOrEmValue(value: string) {
  if (value.endsWith('em')) {
    return value;
  } else if (value.endsWith('px')) {
    return value;
  }

  return `${value}px`;
}

function parseNumber(value: string, defaultNumber: number = 1) {
  try {
    return parseFloat(value);
  } catch (err: any) {
    return defaultNumber;
  }
}

function wrapWithTag(openTag, content) {
  switch (openTag.type) {
    case Tag.Space:
      return `<span class="space" style="margin-left:${parsePixelOrEmValue(
        openTag.attributes.value
      )};">${content}</span>`;
    case Tag.MSpace:
      return `<span class="msspace" style="letter-spacing:${parsePixelOrEmValue(
        openTag.attributes.value
      )};">${content}</span>`;
    case Tag.Color:
      return `<span class="color" style="color:${openTag.attributes.value};">${content}</span>`;
    case Tag.Underline:
      return `<span class="underline">${content}</span>`;
    case Tag.Italic:
      return `<span class="italic">${content}</span>`;
    case Tag.Bold:
      return `<span class="bold">${content}</span>`;
    case Tag.Strikethrough:
      return `<span class="strikethrough">${content}</span>`;
    case Tag.Mark:
      return `<span class="mark" style="background-color:${openTag.attributes.value};">${content}</span>`;
    case Tag.Lowercase:
      return `<span class="lowercase">${content}</span>`;
    case Tag.Uppercase:
      return `<span class="uppercase">${content}</span>`;
    case Tag.Align:
      return `<span class="align" style="text-align:${parsePixelOrEmValue(
        openTag.attributes.value
      )};">${content}</span>`;
    case Tag.CSpace:
      return `<span class="cspace" style="letter-spacing:${parsePixelOrEmValue(
        openTag.attributes.value
      )};">${content}</span>`;
    case Tag.LineHeight:
      return `<span class="lineheight" style="line-height:${parsePixelOrEmValue(
        openTag.attributes.value
      )};">${content}</span>`;
    case Tag.Margin:
      return `<span class="margin" style="margin:0 ${parsePixelOrEmValue(
        openTag.attributes.value
      )};">${content}</span>`;
    case Tag.NoBR:
      return `<nobr>${content}</nobr>`;
    case Tag.Sprite:
      return `<span class="sprite" style="background-color:${openTag.attributes.color};">X</span>`;
    case Tag.Pos:
      return `<span class="pos" style="margin-left:${parsePixelOrEmValue(
        openTag.attributes.value
      )};">${content}</span>`;
    case Tag.Size:
      return `<span class="size" style="font-size:${parsePixelOrEmValue(
        openTag.attributes.value
      )};">${content}</span>`;
    case Tag.Scale:
      return `<span class="scale" style="transform:scale(${parseNumber(
        openTag.attributes.value
      )});">${content}</span>`;
    case Tag.VOffset:
      return `<span class="voffset" style="transform:translate(0px,${parsePixelOrEmValue(
        openTag.attributes.value
      )});">${content}</span>`;
    case Tag.Indent:
      return `<span class="indent" style="margin-left:${parsePixelOrEmValue(
        openTag.attributes.value
      )};">${content}</span>`;
    case Tag.Rotate:
      return `<span class="rotate" style="rotate:${openTag.attributes.value}deg;">${content}</span>`;
  }

  if (openTag.attributes.value) {
    return `&lt${openTag.type}&#61;${openTag.attributes.value}&gt;${content}&lt/${openTag.type}&gt;`;
  }

  return `&lt${openTag.type}&gt;${content}&lt/${openTag.type}&gt;`;
}

export class WebOutputHandler extends OutputHandler {
  private stdin: Stdin;
  private stdout: Stdout;

  constructor(stdin: Stdin, stdout: Stdout) {
    super();
    this.stdin = stdin;
    this.stdout = stdout;
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
      this.stdout.replace(transformed + '\n');
    } else if (appendNewLine) {
      this.stdout.write(transformed + '\n');
    } else {
      this.stdout.write(transformed);
    }
  }

  clear() {
    this.stdout.clear();
  }

  progress(vm: VM, timeout: number): Promise<void> {
    const startTime = Date.now();
    const max = 20;
    this.stdout.write(`[${'-'.repeat(max)}]`);

    return new Promise((resolve, _reject) => {
      const onExit = () => {
        clearInterval(interval);
        resolve();
      };
      const interval = setInterval(() => {
        const currentTime = Date.now();
        const elapsed = currentTime - startTime;

        if (elapsed > timeout) {
          this.stdout.updateLast(`[${'#'.repeat(max)}]`);
          this.stdout.write('\n');
          vm.getSignal().removeListener('exit', onExit);
          clearInterval(interval);
          resolve();
          return;
        }

        const elapsedPercentage = (100 * elapsed) / timeout;
        const progress = Math.floor((elapsedPercentage * max) / 100);
        const right = max - progress;

        this.stdout.updateLast(`[${'#'.repeat(progress)}${'-'.repeat(right)}]`);
      });

      vm.getSignal().once('exit', onExit);
    });
  }

  waitForInput(vm: VM, isPassword: boolean, message: string): Promise<string> {
    return new Promise((resolve, reject) => {
      this.print(vm, message);

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
      this.print(vm, message, {
        appendNewLine: false
      });

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
