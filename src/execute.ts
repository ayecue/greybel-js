import ansis from 'ansis';
import cliProgress from 'cli-progress';
import cssColorNames from 'css-color-names';
import { init as initGHIntrinsics } from 'greybel-gh-mock-intrinsics';
import createMockEnvironment from 'greybel-gh-mock-intrinsics/dist/mock/environment';
import {
  CustomFunction,
  Debugger,
  Defaults,
  HandlerContainer,
  Interpreter,
  KeyEvent,
  ObjectValue,
  OperationContext,
  OutputHandler
} from 'greybel-interpreter';
import { init as initIntrinsics } from 'greybel-intrinsics';
import { ASTBase } from 'greyscript-core';
import inquirer from 'inquirer';
import readline from 'readline';
import transform, { Tag, TagRecord } from 'text-mesh-transformer';
inquirer.registerPrompt('command', require('inquirer-command-prompt'));

const hasOwnProperty = Object.prototype.hasOwnProperty;

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
        prefix: `[${operationContext.target}:${stackAst?.start?.line}] >`,
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

export interface NodeJSKeyEvent {
  sequence: string;
  name: string;
  ctrl: boolean;
  meta: boolean;
  shift: boolean;
  code?: string;
}

export enum NodeJSKey {
  Return = 'return',
  Escape = 'escape',
  Space = 'space',
  Tab = 'tab',
  Up = 'up',
  Right = 'right',
  Left = 'left',
  Down = 'down',
  Backspace = 'backspace',
  Insert = 'insert',
  Home = 'home',
  End = 'end',
  PageDown = 'pagedown',
  PageUp = 'pageup',
  Delete = 'delete',
  F1 = 'f1',
  F2 = 'f2',
  F3 = 'f3',
  F4 = 'f4',
  F5 = 'f5',
  F6 = 'f6',
  F7 = 'f7',
  F8 = 'f8',
  F9 = 'f9',
  F10 = 'f10',
  F11 = 'f11',
  F12 = 'f12'
}

export function nodeJSKeyEventToKeyEvent(
  nodeJSKeyEvent: NodeJSKeyEvent
): KeyEvent {
  const create = (keyCode: number, code: string): KeyEvent => ({
    keyCode,
    code
  });

  switch (nodeJSKeyEvent.name) {
    case NodeJSKey.Return:
      return create(13, 'Enter');
    case NodeJSKey.Escape:
      return create(27, 'Escape');
    case NodeJSKey.Space:
      return create(32, 'Space');
    case NodeJSKey.Tab:
      return create(9, 'Tab');
    case NodeJSKey.Left:
      return create(37, 'ArrowLeft');
    case NodeJSKey.Up:
      return create(38, 'ArrowUp');
    case NodeJSKey.Right:
      return create(39, 'ArrowRight');
    case NodeJSKey.Down:
      return create(40, 'ArrowDown');
    case NodeJSKey.Backspace:
      return create(8, 'Backspace');
    case NodeJSKey.Insert:
      return create(45, 'Insert');
    case NodeJSKey.Home:
      return create(36, 'Home');
    case NodeJSKey.End:
      return create(35, 'End');
    case NodeJSKey.PageDown:
      return create(34, 'PageDown');
    case NodeJSKey.PageUp:
      return create(33, 'PageUp');
    case NodeJSKey.Delete:
      return create(46, 'Delete');
    case NodeJSKey.F1:
      return create(112, 'F1');
    case NodeJSKey.F2:
      return create(113, 'F2');
    case NodeJSKey.F3:
      return create(114, 'F3');
    case NodeJSKey.F4:
      return create(115, 'F4');
    case NodeJSKey.F5:
      return create(116, 'F5');
    case NodeJSKey.F6:
      return create(117, 'F6');
    case NodeJSKey.F7:
      return create(118, 'F7');
    case NodeJSKey.F8:
      return create(119, 'F8');
    case NodeJSKey.F9:
      return create(120, 'F9');
    case NodeJSKey.F10:
      return create(121, 'F10');
    case NodeJSKey.F11:
      return create(122, 'F11');
    case NodeJSKey.F12:
      return create(123, 'F12');
    default: {
      const char = nodeJSKeyEvent.sequence;
      const keyCode = char.toUpperCase().charCodeAt(0);
      const code = nodeJSKeyEvent.name || char;
      return create(keyCode, code);
    }
  }
}

function useColor(color: string | undefined, content: string): string {
  if (!color) return content;

  const cssColorMap = cssColorNames as { [key: string]: string };

  if (hasOwnProperty.call(cssColorMap, color)) {
    const item = cssColorMap[color];
    color = item;
  }

  return ansis.hex(color)(content);
}

function useBgColor(color: string | undefined, content: string): string {
  if (!color) return content;

  const cssColorMap = cssColorNames as { [key: string]: string };

  if (hasOwnProperty.call(cssColorMap, color)) {
    const item = cssColorMap[color];
    color = item;
  }

  return ansis.bgHex(color)(content);
}

function wrapWithTag(openTag: TagRecord, content: string): string {
  switch (openTag.tag) {
    case Tag.Color:
      return useColor(openTag.value, content);
    case Tag.Underline:
      return ansis.underline(content);
    case Tag.Italic:
      return ansis.italic(content);
    case Tag.Bold:
      return ansis.bold(content);
    case Tag.Strikethrough:
      return ansis.strikethrough(content);
    case Tag.Mark:
      return useBgColor(openTag.value, content);
    case Tag.Lowercase:
      return content.toLowerCase();
    case Tag.Uppercase:
      return content.toLowerCase();
  }

  if (openTag.value) {
    return `<${openTag.tag}=${openTag.value}>${content}</${openTag.tag}>`;
  }

  return `<${openTag.tag}>${content}</${openTag.tag}>`;
}

export class CLIOutputHandler extends OutputHandler {
  print(message: string) {
    const transformed = transform(
      message,
      (openTag: TagRecord, content: string): string => {
        return wrapWithTag(openTag, content);
      }
    );

    console.log(transformed);
  }

  clear() {
    console.clear();
  }

  progress(timeout: number): Promise<void> {
    const startTime = Date.now();
    const loadingBar = new cliProgress.SingleBar(
      {},
      cliProgress.Presets.shades_classic
    );
    loadingBar.start(timeout, 0);

    if (!process.stdin.isTTY) {
      console.warn(
        'Stdin TTY is false. Therefore the progress bar cannot be shown.'
      );
    }

    return new Promise((resolve, _reject) => {
      const interval = setInterval(() => {
        const currentTime = Date.now();
        const elapsed = currentTime - startTime;

        if (elapsed > timeout) {
          loadingBar.update(timeout);
          clearInterval(interval);
          loadingBar.stop();
          resolve();
          return;
        }

        loadingBar.update(elapsed);
      });
    });
  }

  waitForInput(isPassword: boolean): Promise<string> {
    return inquirer
      .prompt({
        name: 'default',
        message: 'Input:',
        type: isPassword ? 'password' : 'input',
        loop: false
      })
      .then((inputMap) => {
        return inputMap.default;
      })
      .catch((err) => {
        throw err;
      });
  }

  waitForKeyPress(): Promise<KeyEvent> {
    return new Promise((resolve, _reject) => {
      readline.emitKeypressEvents(process.stdin);

      process.stdin.resume();

      if (process.stdin.isTTY) {
        process.stdin.setRawMode(true);
      } else {
        console.warn(
          "Stdin TTY is false. Therefore anyKey isn't able to detect any input. Press enter to continue."
        );
      }

      process.stdin.once(
        'keypress',
        (character: string, key: NodeJSKeyEvent) => {
          process.stdin.pause();
          resolve(nodeJSKeyEventToKeyEvent(key));
        }
      );
    });
  }
}

export interface ExecuteOptions {
  api?: Map<string, CustomFunction>;
  params?: string[];
  seed?: string;
}

export default async function execute(
  target: string,
  options: ExecuteOptions = {}
): Promise<boolean> {
  const interpreter = new Interpreter({
    target,
    handler: new HandlerContainer({
      outputHandler: new CLIOutputHandler()
    }),
    api: initIntrinsics(
      initGHIntrinsics(new ObjectValue(), createMockEnvironment(options.seed))
    )
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
