import {
  createGHMockEnv,
  init as initGHIntrinsics
} from 'greybel-gh-mock-intrinsics';
import {
  Debugger,
  HandlerContainer,
  Interpreter,
  ObjectValue,
  OperationContext,
  PrepareError,
  RuntimeError
} from 'greybel-interpreter';
import { init as initIntrinsics } from 'greybel-intrinsics';
import process from 'process';

import { GrebyelDebugger } from './execute/debugger.js';
import { WebOutputHandler } from './execute/output.js';
import { PseudoResourceHandler } from './execute/resource.js';
import { Stdin, Stdout } from './std.js';

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

  Interpreter.clearAllIntrinsics();

  const resourceHandler = new PseudoResourceHandler(code);
  const interpreter = new Interpreter({
    target: 'default',
    debugger: new GrebyelDebugger(options.onInteract),
    handler: new HandlerContainer({
      resourceHandler,
      outputHandler: new WebOutputHandler(stdin, stdout)
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
