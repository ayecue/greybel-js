import { editor } from '@inquirer/prompts';
import { init as initGHIntrinsics } from 'greybel-gh-mock-intrinsics';
import {
  CustomValue,
  ObjectValue as ObjectValueType,
  OperationContext,
  DefaultType,
  CustomFunction,
  CustomString,
  HandlerContainer,
  Interpreter,
  ObjectValue
} from 'greybel-interpreter';
import { init as initIntrinsics } from 'greybel-intrinsics';

import CLIOutputHandler from './execute/output.js';
import GrebyelPseudoDebugger from './repl/debugger.js';

export interface REPLOptions {
  api?: ObjectValueType;
}

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
        ctx: OperationContext,
        _self: CustomValue,
        args: Map<string, CustomValue>
      ): Promise<CustomValue> => {
        ctx.handler.outputHandler.print(args.get('value')!.toString());
        active = false;
        return Promise.resolve(DefaultType.Void);
      }
    ).addArgument('value')
  );

  const interpreter = new Interpreter({
    debugger: new GrebyelPseudoDebugger(),
    handler: new HandlerContainer({
      outputHandler: new CLIOutputHandler()
    }),
    api: initIntrinsics(initGHIntrinsics(vsAPI))
  });

  try {
    /* eslint-disable-next-line no-unmodified-loop-condition */
    while (active) {
      const code = await editor({
        message: '>'
      });

      try {
        await interpreter.run(code);
      } catch (err: any) {
        const opc =
          interpreter.apiContext.getLastActive() || interpreter.globalContext;

        console.error(
          `${err.message} at line ${opc.stackItem?.start!.line}:${
            opc.stackItem?.start!.character
          } in ${opc.target}`
        );
      }
    }
  } catch (err: any) {
    console.error(err);

    return false;
  }

  return true;
}
