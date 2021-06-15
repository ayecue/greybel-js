const build = require('../../src/build-light');
const interpreter = require('../../src/interpreter');
const ExitError = require('../../src/emulator/errors/exit');
const polyfills = require('../../src/emulator/polyfills');

module.exports = async function(options) {
	const context = {};
	const content = options.content || options.file.load().getContent();

	try {
		const code = build({
			content: content
		});

		await interpreter({
			code: code,
			params: options.params,
			api: polyfills(options.vm)
		});
	} catch (err) {
		if (!(err instanceof ExitError)) console.error(err);
	}
};