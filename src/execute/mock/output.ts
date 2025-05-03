import { AnotherAnsiProvider, ModifierType } from 'another-ansi';
import ansiEscapes from 'ansi-escapes';
import cliProgress from 'cli-progress';
import {
  KeyEvent,
  OutputHandler,
  PrintOptions,
  UpdateOptions,
  VM
} from 'greybel-interpreter';
import readline from 'readline';
import { TagRecordOpen, transform } from 'text-mesh-transformer';

import { logger } from '../../helper/logger.js';
import {
  customInput as input,
  customPassword as password
} from '../../helper/prompts.js';
import { NodeJSKeyEvent, nodeJSKeyEventToKeyEvent } from '../key-event.js';
import { Terminal, wrapWithTag } from '../output.js';

export default class CLIOutputHandler extends OutputHandler {
  terminal: Terminal;

  constructor() {
    super();
    this.terminal = new Terminal();
  }

  print(
    _vm: VM,
    message: string,
    { appendNewLine = true, replace = false }: Partial<PrintOptions> = {}
  ) {
    this.terminal.print(message, {
      appendNewLine,
      replace
    });
  }

  update(
    _vm: VM,
    message: string,
    { appendNewLine = false, replace = false }: Partial<UpdateOptions> = {}
  ) {
    this.terminal.update(message, {
      appendNewLine,
      replace
    });
  }

  clear(_vm: VM) {
    console.clear();
  }

  async progress(vm: VM, timeout: number): Promise<void> {
    await this.terminal.progress(vm.getSignal(), timeout);
  }

  waitForInput(_vm: VM, isPassword: boolean, message: string): Promise<string> {
    return this.terminal.waitForInput(isPassword, message);
  }

  async waitForKeyPress(vm: VM, message: string): Promise<KeyEvent> {
    const key = await this.terminal.waitForKeyPress(message, () => {
      vm.exit();
    });

    return nodeJSKeyEventToKeyEvent(key);
  }
}
