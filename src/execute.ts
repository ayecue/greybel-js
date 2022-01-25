import { Interpreter, CustomType, Debugger, OperationContext } from 'greybel-interpreter';
import { init as initIntrinsics } from 'greybel-intrinsics';
import { init as initGHIntrinsics } from 'greybel-gh-mock-intrinsics';
import inquirer from 'inquirer';
import { ASTBase } from 'greyscript-core';
inquirer.registerPrompt('command', require('inquirer-command-prompt'));

class GrebyelPseudoDebugger extends Debugger {
	interpreter: Interpreter;

	constructor(interpreter: Interpreter) {
		super();
		this.interpreter = interpreter;
	}

	debug() {
		
	}

	async interact(operationContext: OperationContext, stackAst: ASTBase) {
		console.log(`REPL - Console`);
		console.log(`You can execute code in the current context.`);
		console.log(``);
		console.log(`Press "next" or "exit" to either move to the next line or continue execution.`);

		const me = this;
		const iterate = async () => {
			const result = await inquirer
				.prompt({
					name: 'default',
					prefix: `[Line: ${stackAst.start.line}] >`,
					loop: true
				});
			const line = result['default'];

			if (line === 'next') {
				me.next();
				return;
			} else if (line === 'exit') {
				me.setBreakpoint(false);
				return;
			}

			try {
				await me.interpreter.injectInLastContext(line)
				console.log(`Execution of ${line} was successful.`);
			} catch (err: any) {
				console.error(`Execution of ${line} failed.`);
				console.error(err);
			}

			await iterate();
		};

		await iterate();
	}
}

export interface ExecuteOptions {
	api?: Map<string, Function>;
	params?: string[];
}

export default async function execute(target: string, options: ExecuteOptions = {}): Promise<boolean> {
	const vsAPI = options.api || new Map();

	vsAPI.set('print', (customValue: CustomType): void => {
		console.log(customValue.toString());
	});

	vsAPI.set('exit', (customValue: CustomType): void => {
		console.log(customValue.toString());
		interpreter.exit();
	});

	vsAPI.set('user_input', (message: CustomType, isPassword: CustomType, anyKey: CustomType): Promise<string | null> => {
		return inquirer
			.prompt({
				name: 'default',
				message: message.toString(),
				type: isPassword?.valueOf() ? 'password' : 'input',
				loop: false
			})
			.then(function(inputMap) {
				return inputMap['default'];
			})
			.catch((err) => {
				throw err;
			});
	});

	const interpreter = new Interpreter({
		target,
		api: initIntrinsics(initGHIntrinsics(vsAPI))
	});

	interpreter.setDebugger(new GrebyelPseudoDebugger(interpreter));

	try {
		console.time('Execution');
		interpreter.params = options.params || [];
		await interpreter.digest();
		console.timeEnd('Execution');
	} catch (err: any) {
		const opc = interpreter.apiContext.getLastActive() || interpreter.globalContext;

		console.error(`${err.message} at line ${opc.stackItem?.start.line}:${opc.stackItem?.start.character} in ${opc.target}`);
		console.error(err);

		return false;
	}

	return true;
};