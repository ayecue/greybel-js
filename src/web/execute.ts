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
            const continueButton = document.createElement('input');
    
            bg.classList.add('debugger-popup-bg');
            popup.classList.add('debugger-popup');
    
            continueButton.classList.add('debugger-continue');
            continueButton.type = 'button';
            continueButton.value = 'Continue';
    
            document.body.appendChild(bg);
            document.body.appendChild(popup);

            const scopes = operationContext.lookupAllScopes().map((item: OperationContext) => {
                return parseMap(item.scope.value);
            });
    
            popup.appendChild(viewJSON(scopes));
            popup.appendChild(continueButton);
    
            continueButton.addEventListener('click', function() {
                document.body.removeChild(bg);
                document.body.removeChild(popup);
                me.setBreakpoint(false);
                resolve();
            });
        });
	}
}

let activeInterpreter: Interpreter | null;
export interface ExecuteOptions {
    stdin?: Stdin;
    stdout?: Stdout;
	api?: Map<string, Function>;
	params?: string[];
}

export default async function execute(code: string, options: ExecuteOptions = {}): Promise<void> {
	const vsAPI = options.api || new Map();
    const stdin = options.stdin || new Stdin(new Element());
    const stdout = options.stdout || new Stdout(new Element());

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

	try {
		console.time('Execution');
		interpreter.params = options.params || [];
		await interpreter.digest();
		console.timeEnd('Execution');
	} catch (err: any) {
		const opc = interpreter.apiContext.getLastActive() || interpreter.globalContext;

		console.error(err);
        
        throw new Error(`${err.message} at line ${opc.stackItem?.start.line}:${opc.stackItem?.start.character} in ${opc.target}`);
	} finally {
        activeInterpreter = null;
    }
};