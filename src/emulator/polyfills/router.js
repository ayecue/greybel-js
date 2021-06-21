const typer = require('../../cps-evaluator/typer');

module.exports = function(shell) {
	const api = {};

	api.get_router = function(ip) {
		console.error('get_router not yet supported.');
		return null;
	};

	return api;
};