import {
  createGHMockEnv,
  init as initGHIntrinsics
} from 'greybel-gh-mock-intrinsics';
import {
  CustomValue,
  Debugger,
  DefaultType,
  HandlerContainer,
  Interpreter,
  KeyEvent,
  ObjectValue,
  OperationContext,
  OutputHandler,
  PrepareError,
  PrintOptions,
  ResourceHandler,
  RuntimeError
} from 'greybel-interpreter';
import { init as initIntrinsics } from 'greybel-intrinsics';
import process from 'process';
import { Tag, TagRecord, transform } from 'text-mesh-transformer';

import { Stdin, Stdout } from './std.js';

class GrebyelDebugger extends Debugger {
  onInteract: (dbgr: Debugger, context: OperationContext) => Promise<void>;

  constructor(
    onInteract: (dbgr: Debugger, context: OperationContext) => Promise<void>
  ) {
    super();
    this.onInteract = onInteract;
  }

  debug(..._segments: any[]): CustomValue {
    return DefaultType.Void;
  }

  interact(operationContext: OperationContext): Promise<void> {
    return this.onInteract(this, operationContext);
  }
}

let activeInterpreter: Interpreter | null;
let isReady = true;

export interface ExecuteOptions {
  stdin?: Stdin;
  stdout?: Stdout;
  api?: ObjectValue;
  params: string[];
  seed?: string;
  onStart: (interpreter: Interpreter) => void;
  onError: (err: any) => void;
  onEnd: (interpreter: Interpreter) => void;
  onInteract: (dbgr: Debugger, context: OperationContext) => Promise<void>;
}

function wrapWithTag(openTag: TagRecord, content: string): string {
  switch (openTag.tag) {
    case Tag.Color:
      return `<span style="color:${openTag.value};">${content}</span>`;
    case Tag.Underline:
      return `<span style="text-decoration:underline;">${content}</span>`;
    case Tag.Italic:
      return `<span style="font-style:italic;">${content}</span>`;
    case Tag.Bold:
      return `<span style="font-weight:bold;">${content}</span>`;
    case Tag.Strikethrough:
      return `<span style="text-decoration:line-through;">${content}</span>`;
    case Tag.Mark:
      return `<span style="background-color:${openTag.value};">${content}</span>`;
    case Tag.Lowercase:
      return `<span style="text-transform:lowercase;">${content}</span>`;
    case Tag.Uppercase:
      return `<span style="text-transform:uppercase;">${content}</span>`;
    case Tag.Align:
      return `<span style="text-align:${openTag.value};display:block;">${content}</span>`;
    case Tag.CSpace:
      return `<span style="letter-spacing:${openTag.value};">${content}</span>`;
    case Tag.LineHeight:
      return `<span style="line-height:${openTag.value};">${content}</span>`;
    case Tag.Margin:
      return `<span style="margin:0 ${openTag.value};">${content}</span>`;
    case Tag.NoBR:
      return `<nobr>${content}</nobr>`;
    case Tag.Pos:
      return `<span style="position:absolute;top:${openTag.value};">${content}</span>`;
    case Tag.Size:
      return `<span style="font-size:${openTag.value};">${content}</span>`;
    case Tag.VOffset:
      return `<span style="margin-top:${openTag.value};">${content}</span>`;
  }

  if (openTag.value) {
    return `&lt${openTag.tag}&#61;${openTag.value}&gt;${content}&lt/${openTag.tag}&gt;`;
  }

  return `&lt${openTag.tag}&gt;${content}&lt/${openTag.tag}&gt;`;
}

export default async function execute(
  code: string,
  options: ExecuteOptions
): Promise<void> {
  if (!isReady) {
    return;
  }

  isReady = false;
  const vsAPI: ObjectValue = options.api || new ObjectValue();
  const stdin = options.stdin || new Stdin(new Element());
  const stdout = options.stdout || new Stdout(new Element());

  if (activeInterpreter) {
    await activeInterpreter.exit();
  }

  const WebOutputHandler = class extends OutputHandler {
    print(
      _ctx: OperationContext,
      message: string,
      { appendNewLine = true, replace = false }: Partial<PrintOptions> = {}
    ) {
      const transformed = transform(
        message,
        (openTag: TagRecord, content: string): string => {
          return wrapWithTag(openTag, content);
        }
      ).replace(/\\n/g, '\n');

      if (replace) {
        stdout.updateLast(transformed + '\n');
      } else if (appendNewLine) {
        stdout.write(transformed + '\n');
      } else {
        stdout.write(transformed);
      }
    }

    clear() {
      stdout.clear();
    }

    progress(ctx: OperationContext, timeout: number): Promise<void> {
      const startTime = Date.now();
      const max = 20;
      stdout.write(`[${'-'.repeat(max)}]`);

      return new Promise((resolve, _reject) => {
        const onExit = () => {
          clearInterval(interval);
          resolve();
        };
        const interval = setInterval(() => {
          const currentTime = Date.now();
          const elapsed = currentTime - startTime;

          if (elapsed > timeout) {
            stdout.updateLast(`[${'#'.repeat(max)}]`);
            stdout.write('\n');
            ctx.processState.removeListener('exit', onExit);
            clearInterval(interval);
            resolve();
            return;
          }

          const elapsedPercentage = (100 * elapsed) / timeout;
          const progress = Math.floor((elapsedPercentage * max) / 100);
          const right = max - progress;

          stdout.updateLast(`[${'#'.repeat(progress)}${'-'.repeat(right)}]`);
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
        this.print(ctx, message, {
          appendNewLine: false
        });

        stdin.enable();
        stdin.focus();
        stdin.setType(isPassword ? 'password' : 'text');

        return stdin
          .waitForInput(ctx)
          .then(() => {
            const value = stdin.getValue();

            return resolve(value);
          })
          .catch(reject)
          .finally(() => {
            stdin.clear();
            stdin.disable();
            stdin.setType('text');
          });
      });
    }

    waitForKeyPress(ctx: OperationContext, message: string): Promise<KeyEvent> {
      return new Promise((resolve, reject) => {
        this.print(ctx, message, {
          appendNewLine: false
        });

        stdin.enable();
        stdin.focus();

        return stdin
          .waitForKeyPress(ctx)
          .then((keyEvent) => {
            return resolve({
              keyCode: keyEvent.keyCode,
              code: keyEvent.code
            });
          })
          .catch(reject)
          .finally(() => {
            stdin.clear();
            stdin.disable();
          });
      });
    }
  };

  class PseudoResourceHandler extends ResourceHandler {
    getTargetRelativeTo(_source: string, _target: string): Promise<string> {
      return Promise.reject(new Error('Cannot get relative files in web.'));
    }

    has(target: string): Promise<boolean> {
      return Promise.resolve(target === 'default');
    }

    get(target: string): Promise<string> {
      return Promise.resolve(target === 'default' ? code : '');
    }

    resolve(target: string): Promise<string> {
      return Promise.resolve(target === 'default' ? 'default' : '');
    }
  }

  const resourceHandler = new PseudoResourceHandler();
  const interpreter = new Interpreter({
    target: 'default',
    debugger: new GrebyelDebugger(options.onInteract),
    handler: new HandlerContainer({
      resourceHandler,
      outputHandler: new WebOutputHandler()
    }),
    api: initIntrinsics(
      initGHIntrinsics(
        vsAPI,
        createGHMockEnv({
          seed: options.seed,
          myProgramContent: await resourceHandler.get('default')
        })
      )
    )
  });

  activeInterpreter = interpreter;

  process.nextTick(async () => {
    isReady = true;

    try {
      interpreter.params = options.params || [];
      options.onStart(interpreter);
      const operation = interpreter.run();
      console.time('Execution');
      await operation;
      options.onEnd(interpreter);
    } catch (err: any) {
      if (err instanceof PrepareError) {
        options.onError(
          new Error(
            `Prepare error: ${err.message} at ${err.target}:${
              err.range?.start || 0
            }`
          )
        );
      } else if (err instanceof RuntimeError) {
        options.onError(
          new Error(
            `Runtime error: ${err.message} at ${err.target}\n${err.stack}`
          )
        );
      } else {
        options.onError(err);
      }
    } finally {
      console.timeEnd('Execution');
    }

    activeInterpreter = null;
  });
}
