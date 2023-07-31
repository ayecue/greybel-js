import {
  KeyEvent,
  OperationContext,
  OutputHandler,
  PrintOptions
} from 'greybel-interpreter';
import { Tag, TagRecordOpen, transform } from 'text-mesh-transformer';

import { Stdin, Stdout } from '../std.js';

function wrapWithTag(openTag: TagRecordOpen, content: string): string {
  switch (openTag.type) {
    case Tag.Color:
      return `<span style="color:${openTag.attributes.value};">${content}</span>`;
    case Tag.Underline:
      return `<span style="text-decoration:underline;">${content}</span>`;
    case Tag.Italic:
      return `<span style="font-style:italic;">${content}</span>`;
    case Tag.Bold:
      return `<span style="font-weight:bold;">${content}</span>`;
    case Tag.Strikethrough:
      return `<span style="text-decoration:line-through;">${content}</span>`;
    case Tag.Mark:
      return `<span style="background-color:${openTag.attributes.value};">${content}</span>`;
    case Tag.Lowercase:
      return `<span style="text-transform:lowercase;">${content}</span>`;
    case Tag.Uppercase:
      return `<span style="text-transform:uppercase;">${content}</span>`;
    case Tag.Align:
      return `<span style="text-align:${openTag.attributes.value};display:block;">${content}</span>`;
    case Tag.CSpace:
      return `<span style="letter-spacing:${openTag.attributes.value};">${content}</span>`;
    case Tag.LineHeight:
      return `<span style="line-height:${openTag.attributes.value};">${content}</span>`;
    case Tag.Margin:
      return `<span style="margin:0 ${openTag.attributes.value};">${content}</span>`;
    case Tag.NoBR:
      return `<nobr>${content}</nobr>`;
    case Tag.Pos:
      return `<span style="position:absolute;top:${openTag.attributes.value};">${content}</span>`;
    case Tag.Size:
      return `<span style="font-size:${openTag.attributes.value};">${content}</span>`;
    case Tag.VOffset:
      return `<span style="margin-top:${openTag.attributes.value};">${content}</span>`;
    case Tag.Indent:
      return `<span style="margin-left:${openTag.attributes.value};">${content}</span>`;
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
    _ctx: OperationContext,
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
      this.stdout.updateLast(transformed + '\n');
    } else if (appendNewLine) {
      this.stdout.write(transformed + '\n');
    } else {
      this.stdout.write(transformed);
    }
  }

  clear() {
    this.stdout.clear();
  }

  progress(ctx: OperationContext, timeout: number): Promise<void> {
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
          ctx.processState.removeListener('exit', onExit);
          clearInterval(interval);
          resolve();
          return;
        }

        const elapsedPercentage = (100 * elapsed) / timeout;
        const progress = Math.floor((elapsedPercentage * max) / 100);
        const right = max - progress;

        this.stdout.updateLast(`[${'#'.repeat(progress)}${'-'.repeat(right)}]`);
      });

      ctx.processState.once('exit', onExit);
    });
  }

  waitForInput(
    ctx: OperationContext,
    isPassword: boolean,
    message: string
  ): Promise<string> {
    return new Promise((resolve, reject) => {
      this.print(ctx, message);

      this.stdin.enable();
      this.stdin.focus();
      this.stdin.setType(isPassword ? 'password' : 'text');

      return this.stdin
        .waitForInput(ctx)
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

  waitForKeyPress(ctx: OperationContext, message: string): Promise<KeyEvent> {
    return new Promise((resolve, reject) => {
      this.print(ctx, message, {
        appendNewLine: false
      });

      this.stdin.enable();
      this.stdin.focus();

      return this.stdin
        .waitForKeyPress(ctx)
        .then((keyEvent) => {
          return resolve({
            keyCode: keyEvent.keyCode,
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
