import {
  createGHMockEnv,
  init as initGHIntrinsics
} from 'greybel-gh-mock-intrinsics';
import {
  Debugger,
  HandlerContainer,
  ObjectValue,
  PrepareError,
  RuntimeError,
  VM
} from 'greybel-interpreter';
import { init as initIntrinsics } from 'greybel-intrinsics';
import { Interpreter } from 'greyscript-interpreter';
import process from 'process';

import { GrebyelDebugger } from './execute/debugger.js';
import { WebOutputHandler } from './execute/output.js';
import { PseudoResourceHandler } from './execute/resource.js';
import { Stdin } from './std/stdin.js';
import { StdoutCanvas, StdoutText } from './std/stdout.js';

let activeInterpreter: Interpreter | null;
let isReady = true;

export interface ExecuteOptions {
  stdin?: Stdin;
  stdoutText?: StdoutText;
  stdoutCanvas?: StdoutCanvas;
  api?: ObjectValue;
  params: string[];
  seed?: string;
  debugMode?: boolean;
  onStart: (interpreter: Interpreter) => void;
  onError: (err: any) => void;
  onEnd: (interpreter: Interpreter) => void;
  onInteract: (dbgr: Debugger, vm: VM) => Promise<void>;
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
  const stdoutText = options.stdoutText || new StdoutText(new Element());
  const stdoutCanvas = options.stdoutCanvas || new StdoutCanvas();

  if (activeInterpreter) {
    await activeInterpreter.exit();
  }

  const resourceHandler = new PseudoResourceHandler(code);
  const interpreter = new Interpreter({
    target: 'default',
    debugger: new GrebyelDebugger(options.onInteract),
    handler: new HandlerContainer({
      resourceHandler,
      outputHandler: new WebOutputHandler({
        stdin,
        stdoutCanvas,
        stdoutText
      })
    }),
    debugMode: true
  });

  interpreter.setApi(
    initIntrinsics(
      initGHIntrinsics(
        vsAPI,
        createGHMockEnv(interpreter, {
          seed: options.seed,
          myProgramContent: await resourceHandler.get('default')
        })
      )
    )
  );

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
