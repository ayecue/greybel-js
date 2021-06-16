const typer = require('../../cps-evaluator/typer');
const ExitError = require('../errors/exit');

module.exports = function(vm) {
	const api = {};

	api.print = function(str) {
		const session = vm.getLastSession();

		if (str?.useTable) {
			vm.getLastSession().shell.echo(str.v.valueOf().toString(), true);
		} else {
			vm.getLastSession().shell.echo(str.valueOf().toString());
		}
	};
	api.exit = function(str) {
		this.print(str);
		throw new ExitError();
	};
	api.active_user = function() {
		return typer.cast(vm.getLastSession().computer.getActiveUser().getName());
	};
	api.current_path = function() {
		return typer.cast(vm.getLastSession().computer.fileSystem.cwd());
	};
	api.format_columns = (v) => ({ v: v, useTable: true });
	api.command_info = (v) => v;
	api.bitwise = function(operator, a, b) {
		return typer.cast(eval([a, b].join(' ' + operator + ' ')));
	};
	api.user_input = async function(question, isPassword) {
		const session = vm.getLastSession();
		const output = await session.shell.prompt(question, isPassword);

		return typer.cast(output);
	};
	api.md5 = function(value) {
		return typer.cast(vm.tools.md5(value));
	};
	api.typeof = function(variable) {
		return typer.cast(typer.cast(variable).getType());
	};

	return api;
};