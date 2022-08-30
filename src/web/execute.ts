import { init as initGHIntrinsics } from 'greybel-gh-mock-intrinsics';
import {
  CustomFunction,
  CustomList,
  CustomMap,
  CustomString,
  CustomValue,
  Debugger,
  Defaults,
  HandlerContainer,
  Interpreter,
  OperationContext,
  ResourceHandler
} from 'greybel-interpreter';
import { init as initIntrinsics } from 'greybel-intrinsics';
import process from 'process';

import viewJSON from './json-viewer';
import { Stdin, Stdout } from './std';

function parseMap(map: Map<CustomValue, CustomValue>) {
  return Array.from(map).reduce((result: { [key: string]: any }, item: any) => {
    return {
      ...result,
      [parse(item[0])]: parse(item[1])
    };
  }, {});
}

function parse(item: CustomValue): any {
  if (item instanceof CustomMap) {
    return parseMap(item.value);
  } else if (item instanceof CustomList) {
    return item.value.map((item: any) => {
      return parse(item);
    });
  }

  return item.toString();
}

class GrebyelDebugger extends Debugger {
  debug(..._segments: any[]): CustomValue {
    return Defaults.Void;
  }

  interact(operationContext: OperationContext): Promise<void> {
    const me = this;

    return new Promise(function (resolve, _reject) {
      const bg = document.createElement('div');
      const popup = document.createElement('div');
      const actions = document.createElement('div');
      const title = document.createElement('label');
      const replWrapper = document.createElement('div');
      const replTitle = document.createElement('label');
      const replInput = document.createElement('input');
      const replExecute = document.createElement('input');
      const continueButton = document.createElement('input');
      const nextButton = document.createElement('input');

      bg.classList.add('debugger-popup-bg');
      popup.classList.add('debugger-popup');

      replWrapper.classList.add('debugger-repl-wrapper');

      actions.classList.add('debugger-actions');

      replTitle.innerHTML = 'Execute code in current context:';

      replInput.classList.add('debugger-repl');
      replInput.type = 'input';

      replExecute.classList.add('debugger-repl-execute');
      replExecute.type = 'button';
      replExecute.value = 'Execute';

      continueButton.classList.add('debugger-continue');
      continueButton.type = 'button';
      continueButton.value = 'Continue';

      nextButton.classList.add('debugger-next');
      nextButton.type = 'button';
      nextButton.value = 'Next';

      title.innerHTML = `Current line: ${
        activeInterpreter?.globalContext.getLastActive()?.stackItem?.start!.line
      }`;

      document.body.appendChild(bg);
      document.body.appendChild(popup);

      const scopes = operationContext
        .lookupAllScopes()
        .map((item: OperationContext) => {
          return parseMap(item.scope.value);
        });

      popup.appendChild(title);
      popup.appendChild(viewJSON(scopes));
      popup.appendChild(replWrapper);
      popup.appendChild(actions);

      actions.appendChild(continueButton);
      actions.appendChild(nextButton);

      replWrapper.appendChild(replTitle);
      replWrapper.appendChild(replInput);
      replWrapper.appendChild(replExecute);

      continueButton.addEventListener('click', function () {
        document.body.removeChild(bg);
        document.body.removeChild(popup);
        me.setBreakpoint(false);
        resolve();
      });

      nextButton.addEventListener('click', function () {
        document.body.removeChild(bg);
        document.body.removeChild(popup);
        me.next();
        resolve();
      });

      const injectCode = async () => {
        const code = replInput.value;

        try {
          await activeInterpreter?.injectInLastContext(code);
        } catch (err: any) {
          console.error(err);
        }

        replInput.value = '';
      };

      replInput.addEventListener('keyup', function (e) {
        if (e.key === 'Enter' || e.keyCode === 13) {
          injectCode();
        }
      });

      replExecute.addEventListener('click', injectCode);
    });
  }
}

let activeInterpreter: Interpreter | null;
let isReady = true;

export interface ExecuteOptions {
  stdin?: Stdin;
  stdout?: Stdout;
  api?: Map<string, CustomFunction>;
  params?: string[];
  onStart?: Function;
  onError?: Function;
  onEnd?: Function;
}

export default async function execute(
  code: string,
  options: ExecuteOptions = {}
): Promise<void> {
  if (!isReady) {
    return;
  }

  isReady = false;

  const vsAPI: Map<string, CustomFunction> =
    options.api || new Map<string, CustomFunction>();
  const stdin = options.stdin || new Stdin(new Element());
  const stdout = options.stdout || new Stdout(new Element());

  if (activeInterpreter) {
    await activeInterpreter.exit();
  }

  vsAPI.set(
    'print',
    CustomFunction.createExternal(
      'print',
      (
        _ctx: OperationContext,
        _self: CustomValue,
        args: Map<string, CustomValue>
      ): Promise<CustomValue> => {
        stdout.write(args.get('value')?.toString());
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
        stdout.write(args.get('value')?.toString());
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

        stdout.write(message);

        stdin.enable();
        stdin.focus();
        stdin.setType(isPassword ? 'password' : 'text');

        await stdin.waitForInput();

        const value = stdin.getValue();

        stdin.clear();
        stdin.disable();
        stdin.setType('text');

        return new CustomString(value);
      }
    )
      .addArgument('message')
      .addArgument('isPassword')
      .addArgument('anyKey')
  );

  class PseudoResourceHandler extends ResourceHandler {
    getTargetRelativeTo(_source: string, _target: string): Promise<string> {
      return Promise.reject(new Error('Cannot get relative files in web.'));
    }

    has(target: string): Promise<boolean> {
      return Promise.resolve(target === 'default');
    }

    get(target: string): Promise<string> {
      return Promise.resolve(target === 'default' ? code : '');
    }

    resolve(target: string): Promise<string> {
      return Promise.resolve(target === 'default' ? 'default' : '');
    }
  }

  const interpreter = new Interpreter({
    target: 'default',
    debugger: new GrebyelDebugger(),
    handler: new HandlerContainer({
      resourceHandler: new PseudoResourceHandler()
    }),
    api: initIntrinsics(initGHIntrinsics(vsAPI))
  });

  activeInterpreter = interpreter;

  process.nextTick(async () => {
    isReady = true;

    try {
      interpreter.params = options.params || [];
      options.onStart?.(interpreter);
      const operation = interpreter.run();
      console.time('Execution');
      await operation;
      options.onEnd?.(interpreter);
    } catch (err: any) {
      const opc =
        interpreter.apiContext.getLastActive() || interpreter.globalContext;

      console.error(err);

      options.onError?.(
        new Error(
          `Error "${err.message}" at line ${opc.stackItem?.start!.line}:${
            opc.stackItem?.start!.character
          } in ${opc.target}`
        )
      );
    } finally {
      console.timeEnd('Execution');
    }

    activeInterpreter = null;
  });
}
