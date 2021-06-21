const build = require('../../../src/build-light');
const interpreter = require('../../../src/interpreter');
const Exit = require('../../../src/emulator/signals/exit');
const NewShell = require('../../../src/emulator/signals/new-shell');
const polyfills = require('../../../src/emulator/polyfills');
const EventEmitter = require('events');

module.exports = async function(options) {
	const context = {};
	const content = options.content || options.file.load().getContent();
	const emitter = new EventEmitter();

	try {
		const code = build({
			content: content
		});

		emitter.on('error', (message, item, ...args) => {
			console.error(`[ERROR][Line: ${item.ast.line}]`, ...args);
		});

		emitter.on('debug', (message, ...args) => {
			console.log('[DEBUG]', message, ...args);
		});

		await interpreter({
			code: code,
			params: options.params,
			api: polyfills(options.shell),
			eventEmitter: emitter
		});
	} catch (err) {
		if (err instanceof Exit) {
			console.log(`[EXIT] ${err.getMessage()}`);
		} else if (err instanceof NewShell) {
			const shell = err.getShell();
			await err.shell.start(options.stdout, options.stdin);
		} else {
			console.error(err);
		}
	}
};