const build = require('../../src/build-light');
const interpreter = require('../../src/interpreter');
const ExitError = require('../../src/emulator/errors/exit');
const polyfills = require('../../src/emulator/polyfills');

module.exports = async function(options) {
	const context = {};
	const content = options.content || (await options.file.load()).getContent();

	try {
		let code;

		if (options.filename) {
			code = build(options.filename, null, {
				noWrite: true
			});
		} else {
			code = content;
		}

		await interpreter(code, options.params, polyfills(options.vm));
	} catch (err) {
		if (!(err instanceof ExitError)) console.error(err);
	}
};