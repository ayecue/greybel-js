import { input } from '@inquirer/prompts';
import { ModifierType } from 'another-ansi';
import {
  Debugger,
  DefaultType,
  PrepareError,
  RuntimeError,
  VM
} from 'greybel-interpreter';
import { Interpreter } from 'greyscript-interpreter';

import { ansiProvider, useColor } from './output.js';

export default class GrebyelPseudoDebugger extends Debugger {
  interpreter: Interpreter;

  constructor(interpreter: Interpreter) {
    super();
    this.interpreter = interpreter;
  }

  debug() {
    return DefaultType.Void;
  }

  async interact(vm: VM) {
    const op = vm.getFrame().getCurrentInstruction();

    console.log(
      useColor('cyan', ansiProvider.modify(ModifierType.Bold, `REPL - Console`))
    );
    console.log(
      useColor('cyan', `You can execute code in the current context.`)
    );
    console.log(``);
    console.log(
      useColor(
        'cyan',
        `Press "next" or "exit" to either move to the next line or continue execution.`
      )
    );

    const me = this;
    const iterate = async () => {
      const line = await input({
        message: useColor(
          'cyan',
          `${ansiProvider.modify(
            ModifierType.Bold,
            `[${op.source.path}:${op.source?.start?.line}]`
          )} >`
        )
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
          useColor(
            'green',
            `Execution on ${op.source.path}:${op.source?.start?.line} was successful.`
          )
        );
      } catch (err: any) {
        if (err instanceof PrepareError) {
          console.error(
            useColor(
              'red',
              `${ansiProvider.modify(ModifierType.Bold, 'Prepare error')}: ${
                err.message
              } at ${err.target}:${err.range}`
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
      } finally {
        me.interpreter.debugger.setBreakpoint(true);
      }

      await iterate();
    };

    await iterate();
  }
}
