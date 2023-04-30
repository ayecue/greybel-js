import { editor } from '@inquirer/prompts';
import GreybelInterpreter, {
  Interpreter,
  OperationContext
} from 'greybel-interpreter';
import { ASTBase } from 'greyscript-core';

const { Debugger, DefaultType } = GreybelInterpreter;

export default class GrebyelPseudoDebugger extends Debugger {
  interpreter: Interpreter;

  constructor(interpreter: Interpreter) {
    super();
    this.interpreter = interpreter;
  }

  debug() {
    return DefaultType.Void;
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
      const line = await editor({
        message: `[${operationContext.target}:${stackAst?.start?.line}] >`
      });

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
          `Execution on ${operationContext.target}:${stackAst?.start?.line} was successful.`
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
