import { Interpreter, CustomType, Debugger, OperationContext } from 'greybel-interpreter';
import { init as initIntrinsics } from 'greybel-intrinsics';
import { init as initGHIntrinsics } from 'greybel-gh-mock-intrinsics';
import inquirer from 'inquirer';
inquirer.registerPrompt('command', require('inquirer-command-prompt'));

class GrebyelPseudoDebugger extends Debugger {
	debug() {

	}

	getBreakpoint(operationContext: OperationContext): boolean {
		return false;
	}

	interact(operationContext: OperationContext) {
	}
}

export interface REPLOptions {
	api?: Map<string, Function>;
}

export default async function repl(options: REPLOptions = {}): Promise<boolean> {
	const vsAPI = options.api || new Map();
	let active = true;

	vsAPI.set('print', (customValue: CustomType): void => {
		console.log(customValue.toString());
	});

	vsAPI.set('exit', (customValue: CustomType): void => {
		if (customValue) {
			console.log(customValue?.toString());
		}
		
		active = false;
	});

	vsAPI.set('user_input', async (message: CustomType, isPassword: CustomType, anyKey: CustomType): Promise<string | null> => {
		const result = await inquirer.prompt({
				name: 'default',
				message: message.toString(),
				type: isPassword?.valueOf() ? 'password' : 'input',
				loop: false
			});
		
		return result?.['default'];
	});

	const interpreter = new Interpreter({
		debugger: new GrebyelPseudoDebugger(),
		api: initIntrinsics(initGHIntrinsics(vsAPI))
	});

	try {
		while (active) {
			const inputMap = await inquirer.prompt({
				prefix: '>',
				name: 'repl'
			});

			try {
				await interpreter.digest(inputMap['repl']);
			} catch (err: any) {
				const opc = interpreter.apiContext.getLastActive() || interpreter.globalContext;
		
				console.error(`${err.message} at line ${opc.stackItem?.start.line}:${opc.stackItem?.start.character} in ${opc.target}`);
			}
		}
	} catch (err: any) {
		console.error(err);

		return false;
	}

	return true;
};