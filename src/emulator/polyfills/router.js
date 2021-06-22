const typer = require('../../cps-evaluator/typer');

module.exports = function(shell) {
	const api = {};

	api.get_router = function(ip) {
		shell.echo('get_router not yet supported.');
		return typer.cast(null);
	};

	return api;
};