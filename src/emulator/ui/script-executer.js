const build = require('../../build-light');
const interpreter = require('../../interpreter');
const Signals = require('./signals');
const polyfills = require('./polyfills');
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
			//console.log('[DEBUG]', message, ...args);
		});

		await interpreter({
			code: code,
			params: options.params,
			api: polyfills(options.shell),
			eventEmitter: emitter
		});
	} catch (err) {
		if (err instanceof Signals.Exit) {
			console.log(`[EXIT] ${err.getMessage()}`);
		} else if (err instanceof Signals.NewShell) {
			const shell = err.getShell();
			await err.shell.start(options.stdout, options.stdin);
		} else {
			console.error(err);
		}
	}
};