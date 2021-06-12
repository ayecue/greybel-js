const build = require('../build');
const interpreter = require('../interpreter');
const md5 = require('../utils/md5');
const fs = require('fs');
const path = require('path');
const ExitError = require('./errors/exit');
const chalk = require('chalk');
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

		await interpreter(code, options.params, polyfills(options.vm));
	} catch (err) {
		if (!(err instanceof ExitError)) console.error(err);
	}
};