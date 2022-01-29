import {
    Interpreter,
    CustomType,
    Debugger,
    OperationContext,
    ResourceProvider as InterpreterResourceProviderBase,
    ResourceHandler as InterpreterResourceHandler,
    CustomMap,
    CustomList
} from 'greybel-interpreter';
import { init as initIntrinsics } from 'greybel-intrinsics';
import { init as initGHIntrinsics } from 'greybel-gh-mock-intrinsics';
import viewJSON from './json-viewer';
import { Stdin, Stdout } from './std';
import EventEmitter from 'events';
import process from 'process';

function parseMap(map: Map<string, string>) {
    return Array.from(map).reduce((result: { [key: string]: any }, item: any) => {
        return {
            ...result,
            [item[0]]: parse(item[1])
        };
    }, {});
}

function parse(item: any): any {
    if (item instanceof CustomMap) {
        return parseMap(item.value);
    } else if (item instanceof CustomList) {
        return item.value.map((item: any) => {
            return parse(item);
        });
    }

    return item?.toString();
}

class GrebyelDebugger extends Debugger {
    debug(): void {
        
    }

	interact(operationContext: OperationContext): Promise<void> {
        const me = this;

		return new Promise(function(resolve, reject) {
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

            replTitle.innerHTML = "Execute code in current context:"

            replInput.classList.add('debugger-repl');
            replInput.type = "input";

            replExecute.classList.add('debugger-repl-execute');
            replExecute.type = 'button';
            replExecute.value = 'Execute';
    
            continueButton.classList.add('debugger-continue');
            continueButton.type = 'button';
            continueButton.value = 'Continue';

            nextButton.classList.add('debugger-next');
            nextButton.type = 'button';
            nextButton.value = 'Next';

            title.innerHTML = `Current line: ${activeInterpreter?.globalContext.getLastActive()?.stackItem?.start.line}`;
    
            document.body.appendChild(bg);
            document.body.appendChild(popup);

            const scopes = operationContext.lookupAllScopes().map((item: OperationContext) => {
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
    
            continueButton.addEventListener('click', function() {
                document.body.removeChild(bg);
                document.body.removeChild(popup);
                me.setBreakpoint(false);
                resolve();
            });

            nextButton.addEventListener('click', function() {
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
	api?: Map<string, Function>;
	params?: string[];
}

export default async function execute(code: string, options: ExecuteOptions = {}): Promise<EventEmitter | null> {
    if (!isReady) {
        return null;
    }

    isReady = false;

	const vsAPI = options.api || new Map();
    const stdin = options.stdin || new Stdin(new Element());
    const stdout = options.stdout || new Stdout(new Element());
    const emitter = new EventEmitter();

    if (activeInterpreter) {
        await activeInterpreter.exit();
    }

	vsAPI.set('print', (customValue: CustomType): void => {
		stdout.write(customValue.toString());
	});

	vsAPI.set('exit', (customValue: CustomType): void => {
		stdout.write(customValue.toString());
		interpreter.exit();
	});

	vsAPI.set('user_input', async (message: CustomType, isPassword: CustomType, anyKey: CustomType): Promise<string | null> => {
        stdout.write(message.toString());

        stdin.enable();
        stdin.focus();
        stdin.setType(!!isPassword?.valueOf() ? 'password' : 'text');

        await stdin.waitForInput();

        const value = stdin.getValue();

        stdin.clear();
        stdin.disable();
        stdin.setType('text');

        return value;
	});

    class PseudoInterpeterResourceProvider extends InterpreterResourceProviderBase {
        getHandler(): InterpreterResourceHandler {
            return {
                getTargetRelativeTo: async (source: string, target: string): Promise<string> => {
                    return Promise.reject(new Error('Cannot get relative files in web.'));
                },
                has: async (target: string): Promise<boolean> => {
                    return Promise.resolve(target === 'default');
                },
                get: (target: string): Promise<string> => {
                    return Promise.resolve(target === 'default' ? code : '');
                },
                resolve: (target: string): Promise<string> => {
                    return Promise.resolve(target === 'default' ? 'default' : '');
                }
            };
        }
    }

	const interpreter = new Interpreter({
        target: 'default',
		debugger: new GrebyelDebugger(),
        resourceHandler: new PseudoInterpeterResourceProvider().getHandler(),
		api: initIntrinsics(initGHIntrinsics(vsAPI))
	});

    activeInterpreter = interpreter;

    process.nextTick(async () => {
        isReady = true;

        try {
            interpreter.params = options.params || [];
            const operation = interpreter.digest();
            emitter.emit('start', interpreter);
            console.time('Execution');
            await operation;
            console.timeEnd('Execution');
            emitter.emit('end', interpreter);
        } catch (err: any) {
            const opc = interpreter.apiContext.getLastActive() || interpreter.globalContext;
    
            console.error(err);

            emitter.emit('error', new Error(`${err.message} at line ${opc.stackItem?.start.line}:${opc.stackItem?.start.character} in ${opc.target}`));
        }

        activeInterpreter = null;
    });

    return emitter;
};