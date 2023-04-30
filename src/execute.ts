import {
  createGHMockEnv,
  init as initGHIntrinsics
} from 'greybel-gh-mock-intrinsics';
import {
  CustomFunction,
  DefaultResourceHandler,
  HandlerContainer,
  Interpreter,
  ObjectValue
} from 'greybel-interpreter';
import { init as initIntrinsics } from 'greybel-intrinsics';

import EnvMapper from './build/env-mapper.js';
import GrebyelPseudoDebugger from './execute/debugger.js';
import CLIOutputHandler from './execute/output.js';

export interface ExecuteOptions {
  api: Map<string, CustomFunction>;
  params: string[];
  seed: string;
  envFiles: string[];
  envVars: string[];
}

export default async function execute(
  target: string,
  options: Partial<ExecuteOptions> = {}
): Promise<boolean> {
  const envMapper = new EnvMapper();

  envMapper.load(options.envFiles, options.envVars);

  const resourceHandler = new DefaultResourceHandler();
  const interpreter = new Interpreter({
    target,
    handler: new HandlerContainer({
      outputHandler: new CLIOutputHandler(),
      resourceHandler
    }),
    api: initIntrinsics(
      initGHIntrinsics(
        new ObjectValue(),
        createGHMockEnv({
          seed: options.seed,
          myProgramContent: await resourceHandler.get(target)
        })
      )
    ),
    environmentVariables: new Map(Object.entries(envMapper.map))
  });

  interpreter.setDebugger(new GrebyelPseudoDebugger(interpreter));

  try {
    console.time('Execution');
    interpreter.params = options.params || [];
    await interpreter.run();
    console.timeEnd('Execution');
  } catch (err: any) {
    const opc =
      interpreter.apiContext.getLastActive() || interpreter.globalContext;

    console.error(
      `${err.message} at line ${opc.stackItem?.start!.line}:${
        opc.stackItem?.start!.character
      } in ${opc.target}`
    );
    console.error(err);

    return false;
  }

  return true;
}
