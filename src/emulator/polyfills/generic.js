const typer = require('../../cps-evaluator/typer');
const Exit = require('../signals/exit');

module.exports = function(shell) {
	const api = {};

	api.print = function(str) {
		if (str?.useTable) {
			shell.echo(str.v.valueOf().toString(), true);
		} else {
			shell.echo(str.valueOf().toString());
		}
	};
	api.exit = function(str) {
		this.print(str);
		return Promise.reject(new Exit(str));
	};
	api.active_user = function() {
		return typer.cast(shell.getUser().getName());
	};
	api.current_path = function() {
		return typer.cast(shell.cwd());
	};
	api.format_columns = (v) => ({ v: v, useTable: true });
	api.command_info = (v) => v;
	api.bitwise = function(operator, a, b) {
		return typer.cast(eval([a, b].join(' ' + operator + ' ')));
	};
	api.user_input = async function(question, isPassword) {
		const output = await shell.prompt(question, isPassword);

		return typer.cast(output);
	};
	api.md5 = function(value) {
		return typer.cast(shell.tools.md5(value));
	};
	api.typeof = function(variable) {
		return typer.cast(typer.cast(variable).getType());
	};
	api.slice = function(value, startIndex, endIndex) {
		if (typer.isCustomList(value) || typer.isCustomString(value)) {
			return value.slice(startIndex, endIndex);
		}
	};

	return api;
};