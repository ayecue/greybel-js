const typer = require('../../../cps-evaluator/typer');
const crypto = require('./crypto');
const metaxploit = require('./metaxploit');

module.exports = function(shell) {
	const api = {};

	api.include_lib = function(str) {
		shell.echo('This will include both crypto and metaxploit regardless if it exists or not.');
		const interfaces = {
			...crypto(shell),
			...metaxploit(shell)
		};
		return typer.cast(interfaces);
	};

	return api;
};