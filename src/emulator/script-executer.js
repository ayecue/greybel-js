const build = require('./compiler/build');
const md5 = require('../utils/md5');
const fs = require('fs');
const path = require('path');
const ExitError = require('./errors/exit');
const chalk = require('chalk');

module.exports = async function(options) {
	const context = {};
	const content = options.content || (await options.file.load()).getContent();
	const code = build(content);
	const tempFileName = `test-${md5(code)}.js`;
	const tempFilepath = path.resolve(process.cwd(), tempFileName);

	try {
		fs.writeFileSync(tempFilepath, code);
		console.log(chalk.yellow('Executing ' + tempFilepath));
		console.log(chalk.yellow('Args ' + options.params.join(', ')));
		const execute = require(tempFilepath);
		const args = [
			options.vm,
			options.params,
			function(message) {
				if (message) console.log(message);
				throw new ExitError();
			},
			context
		];

		await execute(...args);
	} catch (err) {
		if (!(err instanceof ExitError)) console.error(err);
	}

	setTimeout(function() {
		if (fs.existsSync(tempFilepath)) fs.unlinkSync(tempFilepath);
	}, 20000);
};