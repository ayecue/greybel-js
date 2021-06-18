const build = require('../build');
const interpreter = require('../interpreter');
const Exit = require('./signals/exit');
const NewShell = require('./signals/new-shell');
const polyfills = require('./polyfills');
const EventEmitter = require('events');

module.exports = async function(options) {
	const context = {};
	const content = options.content || (await options.file.load()).getContent();
	const emitter = new EventEmitter();

	try {
		let code;

		if (options.filename) {
			code = build(options.filename, null, {
				noWrite: true
			});
		} else {
			code = content;
		}

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
			await err.getShell().start();
		} else {
			console.error(err);
		}
	}
};