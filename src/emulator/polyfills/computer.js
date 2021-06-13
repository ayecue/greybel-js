const typer = require('../../cps-evaluator/typer');
const file = require('./file');

module.exports = function(session) {
	const computerInterface = {};

	computerInterface.__isa = 'computer';
	computerInterface.File = file.bind(null, session);
	computerInterface.show_procs = function() {
		console.log('delete is not yet supported');
		return typer.cast("");
	};

	return typer.cast(computerInterface);
};