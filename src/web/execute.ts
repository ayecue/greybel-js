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
import Monaco from 'monaco-editor/esm/vs/editor/editor.api';
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
  editorInstance: Monaco.editor.IStandaloneCodeEditor;

  constructor(editorInstance: Monaco.editor.IStandaloneCodeEditor) {
    super();
    this.editorInstance = editorInstance;
  }

  debug(..._segments: any[]): CustomValue {
    return Defaults.Void;
  }

  interact(operationContext: OperationContext): Promise<void> {
    const me = this;
    let lastActiveLine: Element | undefined;
    const createNavigationPopup = (options: {
      onContinue: (ev: MouseEvent) => any;
      onExecute: (input: HTMLInputElement) => any;
      onNext: (ev: MouseEvent) => any;
    }): HTMLElement => {
      const repl = document.createElement('div');
      const replInput = document.createElement('input');
      const replExecute = document.createElement('input');

      repl.classList.add('debugger-repl-wrapper');

      replInput.classList.add('debugger-repl');
      replInput.type = 'input';

      replExecute.classList.add('debugger-repl-execute');
      replExecute.type = 'button';
      replExecute.value = 'Execute';

      repl.appendChild(replInput);
      repl.appendChild(replExecute);

      const actions = document.createElement('div');
      const continueButton = document.createElement('input');
      const nextButton = document.createElement('input');

      actions.classList.add('debugger-actions');

      continueButton.classList.add('debugger-continue');
      continueButton.type = 'button';
      continueButton.value = 'Continue';

      nextButton.classList.add('debugger-next');
      nextButton.type = 'button';
      nextButton.value = 'Next';

      actions.appendChild(continueButton);
      actions.appendChild(nextButton);

      const popup = document.createElement('div');

      popup.classList.add('debugger-popup-navigation');

      popup.appendChild(repl);
      popup.appendChild(actions);

      replInput.addEventListener('keyup', function (ev) {
        if (ev.key === 'Enter' || ev.keyCode === 13) {
          options.onExecute(replInput);
        }
      });
      replExecute.addEventListener('click', (ev: MouseEvent) =>
        options.onExecute(replInput)
      );
      continueButton.addEventListener('click', options.onContinue);
      nextButton.addEventListener('click', options.onNext);

      return popup;
    };
    const createScopePopup = (): HTMLElement => {
      const scope = document.createElement('div');

      scope.classList.add('debugger-popup-scope');

      const scopes = operationContext
        .lookupAllScopes()
        .map((item: OperationContext) => {
          return parseMap(item.scope.value);
        });

      scope.appendChild(viewJSON(scopes));

      return scope;
    };
    const createBackground = (): HTMLElement => {
      const bg = document.createElement('div');

      bg.classList.add('debugger-popup-bg');

      return bg;
    };

    return new Promise((resolve, _reject) => {
      const bg = createBackground();
      const scope = createScopePopup();
      const injectCode = async (replInput: HTMLInputElement) => {
        const code = replInput.value;

        try {
          me.setBreakpoint(false);
          await activeInterpreter?.injectInLastContext(code);
        } catch (err: any) {
          console.error(err);
        } finally {
          me.setBreakpoint(true);
        }

        replInput.value = '';
      };
      const navigation = createNavigationPopup({
        onContinue: (_ev: MouseEvent) => {
          lastActiveLine?.classList.remove('highlight');
          document.body.removeChild(bg);
          document.body.removeChild(navigation);
          document.body.removeChild(scope);
          me.setBreakpoint(false);
          resolve();
        },
        onNext: (_ev: MouseEvent) => {
          lastActiveLine?.classList.remove('highlight');
          document.body.removeChild(bg);
          document.body.removeChild(navigation);
          document.body.removeChild(scope);
          me.next();
          resolve();
        },
        onExecute: injectCode
      });
      const line =
        activeInterpreter?.globalContext.getLastActive()?.stackItem?.start!
          .line || -1;

      if (line !== -1) {
        lastActiveLine = Array.from(
          document.querySelectorAll(`.line-numbers`)
        ).find((item: Element) => {
          return item.textContent === line.toString();
        });

        lastActiveLine?.classList.add('highlight');
        this.editorInstance.revealLineInCenter(line);
      }

      document.body.appendChild(bg);
      document.body.appendChild(navigation);
      document.body.appendChild(scope);
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
  instance: Monaco.editor.IStandaloneCodeEditor,
  model: Monaco.editor.IModel,
  options: ExecuteOptions = {}
): Promise<void> {
  if (!isReady) {
    return;
  }

  isReady = false;

  const code = model.getValue();
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
    debugger: new GrebyelDebugger(instance),
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
