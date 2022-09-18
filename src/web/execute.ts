import { init as initGHIntrinsics } from 'greybel-gh-mock-intrinsics';
import {
  CustomFunction,
  CustomString,
  CustomValue,
  Debugger,
  Defaults,
  HandlerContainer,
  Interpreter,
  KeyEvent,
  OperationContext,
  OutputHandler,
  ResourceHandler
} from 'greybel-interpreter';
import { init as initIntrinsics } from 'greybel-intrinsics';
import Monaco from 'monaco-editor/esm/vs/editor/editor.api';
import process from 'process';

import { Stdin, Stdout } from './std';

class GrebyelDebugger extends Debugger {
  onInteract: (dbgr: Debugger, context: OperationContext) => Promise<void>;

  constructor(
    onInteract: (dbgr: Debugger, context: OperationContext) => Promise<void>
  ) {
    super();
    this.onInteract = onInteract;
  }

  debug(..._segments: any[]): CustomValue {
    return Defaults.Void;
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
  api?: Map<string, CustomFunction>;
  params: string[];
  onStart: (interpreter: Interpreter) => void;
  onError: (err: any) => void;
  onEnd: (interpreter: Interpreter) => void;
  onInteract: (dbgr: Debugger, context: OperationContext) => Promise<void>;
}

export default async function execute(
  model: Monaco.editor.IModel,
  options: ExecuteOptions
): Promise<void> {
  if (!isReady) {
    return;
  }

  isReady = false;

  const code = model.getValue();
  const vsAPI: Map<string, CustomFunction> =
    options.api || new Map<string, CustomFunction>();
  const stdin = options.stdin || new Stdin(new Element());
  const stdout = options.stdout || new Stdout(new Element());

  if (activeInterpreter) {
    await activeInterpreter.exit();
  }

  const WebOutputHandler = class extends OutputHandler {
    print(message: string) {
      stdout.write(message);
    }

    clear() {
      stdout.clear();
    }

    progress(timeout: number): Promise<void> {
      const startTime = Date.now();
      const max = 20;
      stdout.write(`[${'-'.repeat(max)}]`);

      return new Promise((resolve, _reject) => {
        const interval = setInterval(() => {
          const currentTime = Date.now();
          const elapsed = currentTime - startTime;

          if (elapsed > timeout) {
            stdout.updateLast(`[${'#'.repeat(max)}]`);
            clearInterval(interval);
            resolve();
            return;
          }

          const elapsedPercentage = 100 * elapsed / timeout;
          const progress = Math.floor(elapsedPercentage * max / 100);
          const right = max - progress;

          stdout.updateLast(`[${'#'.repeat(progress)}${'-'.repeat(right)}]`);
        });
      });
    }

    async waitForInput(isPassword: boolean): Promise<string> {
      stdin.enable();
      stdin.focus();
      stdin.setType(isPassword ? 'password' : 'text');

      await stdin.waitForInput();

      const value = stdin.getValue();

      stdin.clear();
      stdin.disable();
      stdin.setType('text');

      return value;
    }

    async waitForKeyPress(): Promise<KeyEvent> {
      stdin.enable();
      stdin.focus();

      const keyEvent = await stdin.waitForKeyPress();

      stdin.clear();
      stdin.disable();

      return {
        keyCode: keyEvent.keyCode,
        code: keyEvent.code
      };
    }
  }

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

  const interpreter = new Interpreter({
    target: 'default',
    debugger: new GrebyelDebugger(options.onInteract),
    handler: new HandlerContainer({
      resourceHandler: new PseudoResourceHandler(),
      outputHandler: new WebOutputHandler()
    }),
    api: initIntrinsics(initGHIntrinsics(vsAPI))
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
      const opc =
        interpreter.apiContext.getLastActive() || interpreter.globalContext;

      if (opc.stackItem) {
        options.onError(
          new Error(
            `Error "${err.message}" at line ${opc.stackItem.start!.line}:${
              opc.stackItem.start!.character
            } in ${opc.target}`
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
