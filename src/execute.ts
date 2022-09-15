import { init as initGHIntrinsics } from 'greybel-gh-mock-intrinsics';
import {
  CustomFunction,
  CustomString,
  CustomValue,
  Debugger,
  Defaults,
  Interpreter,
  OperationContext
} from 'greybel-interpreter';
import { init as initIntrinsics } from 'greybel-intrinsics';
import { ASTBase } from 'greyscript-core';
import inquirer from 'inquirer';
inquirer.registerPrompt('command', require('inquirer-command-prompt'));

class GrebyelPseudoDebugger extends Debugger {
  interpreter: Interpreter;

  constructor(interpreter: Interpreter) {
    super();
    this.interpreter = interpreter;
  }

  debug() {
    return Defaults.Void;
  }

  async interact(operationContext: OperationContext, stackAst: ASTBase) {
    console.log(`REPL - Console`);
    console.log(`You can execute code in the current context.`);
    console.log(``);
    console.log(
      `Press "next" or "exit" to either move to the next line or continue execution.`
    );

    const me = this;
    const iterate = async () => {
      const result = await inquirer.prompt({
        name: 'default',
        prefix: `[Line: ${stackAst.start!.line}] >`,
        loop: true
      });
      const line = result.default;

      if (line === 'next') {
        me.next();
        return;
      } else if (line === 'exit') {
        me.setBreakpoint(false);
        return;
      }

      try {
        me.interpreter.debugger.setBreakpoint(false);
        await me.interpreter.injectInLastContext(line);
        console.log(
          `Execution of ${line}:${operationContext.target} was successful.`
        );
      } catch (err: any) {
        console.error(`Execution of ${line} failed.`);
        console.error(err);
      } finally {
        me.interpreter.debugger.setBreakpoint(true);
      }

      await iterate();
    };

    await iterate();
  }
}

export interface ExecuteOptions {
  api?: Map<string, CustomFunction>;
  params?: string[];
}

export default async function execute(
  target: string,
  options: ExecuteOptions = {}
): Promise<boolean> {
  const vsAPI = options.api || new Map<string, CustomFunction>();

  vsAPI.set(
    'print',
    CustomFunction.createExternal(
      'print',
      (
        _ctx: OperationContext,
        _self: CustomValue,
        args: Map<string, CustomValue>
      ): Promise<CustomValue> => {
        console.log(args.get('value')?.toString());
        return Promise.resolve(Defaults.Void);
      }
    ).addArgument('value')
  );

  vsAPI.set(
    'exit',
    CustomFunction.createExternal(
      'exit',
      (
        _ctx: OperationContext,
        _self: CustomValue,
        args: Map<string, CustomValue>
      ): Promise<CustomValue> => {
        console.log(args.get('value')?.toString());
        interpreter.exit();
        return Promise.resolve(Defaults.Void);
      }
    ).addArgument('value')
  );

  vsAPI.set(
    'user_input',
    CustomFunction.createExternal(
      'user_input',
      async (
        _ctx: OperationContext,
        _self: CustomValue,
        args: Map<string, CustomValue>
      ): Promise<CustomValue> => {
        const message = args.get('message')?.toString();
        const isPassword = args.get('isPassword')?.toTruthy();

        return inquirer
          .prompt({
            name: 'default',
            message,
            type: isPassword ? 'password' : 'input',
            loop: false
          })
          .then(function (inputMap) {
            return new CustomString(inputMap.default);
          })
          .catch((err) => {
            throw err;
          });
      }
    )
      .addArgument('message')
      .addArgument('isPassword')
      .addArgument('anyKey')
  );

  const interpreter = new Interpreter({
    target,
    api: initIntrinsics(initGHIntrinsics(vsAPI))
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
