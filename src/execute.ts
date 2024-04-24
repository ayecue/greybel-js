import { ModifierType } from 'another-ansi';
import {
  createGHMockEnv,
  init as initGHIntrinsics
} from 'greybel-gh-mock-intrinsics';
import {
  CustomFunction,
  DefaultResourceHandler,
  HandlerContainer,
  ObjectValue,
  PrepareError,
  RuntimeError
} from 'greybel-interpreter';
import { init as initIntrinsics } from 'greybel-intrinsics';
import { Interpreter } from 'greyscript-interpreter';

import EnvMapper from './build/env-mapper.js';
import GreybelPseudoDebugger from './execute/debugger.js';
import CLIOutputHandler, { ansiProvider, useColor } from './execute/output.js';
import { InterpreterResourceProvider } from './execute/resource.js';

export interface ExecuteOptions {
  api: Map<string, CustomFunction>;
  params: string[];
  seed: string;
  envFiles: string[];
  envVars: string[];
  debugMode: boolean;
}

export default async function execute(
  target: string,
  options: Partial<ExecuteOptions> = {}
): Promise<boolean> {
  const envMapper = new EnvMapper();

  envMapper.load(options.envFiles, options.envVars);

  const resourceHandler = new InterpreterResourceProvider();
  const interpreter = new Interpreter({
    target: await resourceHandler.resolve(target),
    handler: new HandlerContainer({
      outputHandler: new CLIOutputHandler(),
      resourceHandler
    }),
    environmentVariables: new Map(Object.entries(envMapper.map)),
    debugMode: options.debugMode
  });

  interpreter.setApi(
    initIntrinsics(
      initGHIntrinsics(
        new ObjectValue(),
        createGHMockEnv(interpreter, {
          seed: options.seed,
          myProgramContent: await resourceHandler.get(target)
        })
      )
    )
  );

  interpreter.setDebugger(new GreybelPseudoDebugger(interpreter));

  try {
    console.time('Execution');
    interpreter.params = options.params || [];
    await interpreter.run();
    console.timeEnd('Execution');
  } catch (err: any) {
    if (err instanceof PrepareError) {
      console.error(
        useColor(
          'red',
          `${ansiProvider.modify(ModifierType.Bold, 'Prepare error')}: ${
            err.message
          } at ${err.target}:${err.range?.start || 0}`
        )
      );
    } else if (err instanceof RuntimeError) {
      console.error(
        useColor(
          'red',
          `${ansiProvider.modify(ModifierType.Bold, 'Runtime error')}: ${
            err.message
          } at ${err.target}\n${err.stack}`
        )
      );
    } else {
      console.error(
        useColor(
          'red',
          `${ansiProvider.modify(ModifierType.Bold, 'Unexpected error')}: ${
            err.message
          }\n${err.stack}`
        )
      );
    }

    return false;
  }

  return true;
}
