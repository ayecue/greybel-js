const typer = require('../../cps-evaluator/typer');
const file = require('./file');

module.exports = function(shell) {
	const computerInterface = {};

	computerInterface.__isa = 'computer';
	computerInterface.File = file.bind(null, shell);
	computerInterface.show_procs = function() {
		console.log('show_procs is not yet supported');
		return typer.cast("");
	};

	return typer.cast(computerInterface);
};