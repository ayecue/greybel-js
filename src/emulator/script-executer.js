const build = require('../build');
const interpreter = require('../interpreter');
const ExitError = require('./errors/exit');
const polyfills = require('./polyfills');

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

		await interpreter({
			code: code,
			params: options.params,
			api: polyfills(options.vm)
		});
	} catch (err) {
		if (!(err instanceof ExitError)) console.error(err);
	}
};