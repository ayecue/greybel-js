import { editor } from '@inquirer/prompts';
import { ModifierType } from 'another-ansi';
import {
  createGHMockEnv,
  init as initGHIntrinsics
} from 'greybel-gh-mock-intrinsics';
import {
  CustomFunction,
  CustomString,
  CustomValue,
  DefaultType,
  HandlerContainer,
  ObjectValue,
  PrepareError,
  RuntimeError,
  VM
} from 'greybel-interpreter';
import { init as initIntrinsics } from 'greybel-intrinsics';
import { Interpreter } from 'greyscript-interpreter';

import CLIOutputHandler, { ansiProvider, useColor } from './execute/output.js';
import { logger } from './helper/logger.js';
import GrebyelPseudoDebugger from './repl/debugger.js';
import { REPLOptions } from './repl/types.js';

export default async function repl(
  options: REPLOptions = {}
): Promise<boolean> {
  const vsAPI = options.api || new ObjectValue();
  let active = true;

  vsAPI.set(
    new CustomString('exit'),
    CustomFunction.createExternal(
      'exit',
      (
        vm: VM,
        _self: CustomValue,
        args: Map<string, CustomValue>
      ): Promise<CustomValue> => {
        vm.handler.outputHandler.print(vm, args.get('value')!.toString());
        active = false;
        return Promise.resolve(DefaultType.Void);
      }
    ).addArgument('value')
  );

  const interpreter = new Interpreter({
    debugger: new GrebyelPseudoDebugger(),
    handler: new HandlerContainer({
      outputHandler: new CLIOutputHandler()
    })
  });

  interpreter.setApi(
    initIntrinsics(
      initGHIntrinsics(new ObjectValue(), createGHMockEnv(interpreter))
    )
  );

  try {
    /* eslint-disable-next-line no-unmodified-loop-condition */
    while (active) {
      const code = await editor({
        message: '>'
      });

      if (code === '') continue;

      const outputGroupLabel = useColor('cyan', `Execution:`);

      console.group(outputGroupLabel);

      try {
        await interpreter.run({
          customCode: code
        });
      } catch (err: any) {
        if (err instanceof PrepareError) {
          logger.error(
            useColor(
              'red',
              `${ansiProvider.modify(ModifierType.Bold, 'Prepare error')}: ${err.message
              } at ${err.target}:${err.range?.start || 0}`
            )
          );
        } else if (err instanceof RuntimeError) {
          logger.error(
            useColor(
              'red',
              `${ansiProvider.modify(ModifierType.Bold, 'Runtime error')}: ${err.message
              } at ${err.target}\n${err.stack}`
            )
          );
        } else {
          logger.error(
            useColor(
              'red',
              `${ansiProvider.modify(ModifierType.Bold, 'Unexpected error')}: ${err.message
              }\n${err.stack}`
            )
          );
        }
      }

      console.groupEnd();
    }
  } catch (err: any) {
    logger.error(err);

    return false;
  }

  return true;
}
