const typer = require('../../../cps-evaluator/typer');
const Exit = require('../signals/exit');

module.exports = function(shell) {
	const api = {};

	api.print = function(str) {
		if (typer.isCustomMap(str)) {
			shell.echo(str.value.v.valueOf()?.toString() || '', true);
		} else {
			shell.echo(str?.valueOf()?.toString() || '');
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
	api.home_dir = function() {
		return typer.cast(shell.getHome());
	};
	api.parent_path = function(filepath) {
		filepath = filepath.valueOf();

		if (filepath.startsWith('/')) {
			filepath = shell.computer.fileSystem.resolve(filepath, '..');
		}

		return filepath;
	};
	api.format_columns = (v) => ({ v: v, useTable: true });
	api.command_info = (v) => v;
	api.bitwise = (function() {
		const operatorMap = {
			'^': (a, b) => a ^ b,
			'|': (a, b) => a | b,
			'<<': (a, b) => a << b,
			'>>': (a, b) => a >> b,
			'>>>': (a, b) => a >>> b,
			'&': (a, b) => a & b
		};

		return function(operator, a, b) {
			return typer.cast(operatorMap[operator](a.valueOf(), b.valueOf()));
		};
	})();
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
	api.wait = function(time = 1) {
		return new Promise((r) => setTimeout(r, time * 1000));
	};
	api.current_date = function() {
		const currentDate = shell.vm.getTime();
		const day = currentDate.getDay();
		const month = currentDate.getMonth();
		const year = currentDate.getFullYear();
		const hours = `0${currentDate.getHours()}`.slice(-2);
		const minutes = `0${currentDate.getMinutes()}`.slice(-2);
		const dateStr = `${day}-${month}-${year} ${hours}:${minutes}`;
		return typer.cast(dateStr);
	};
	api.time = (function() {
		const startDate = shell.vm.getTime();

		return function() {
			const currentDate = shell.vm.getTime();
			return typer.cast((currentDate - startDate) / 1000);
		};
	})();
	api.nslookup = async function(domain) {
		return typer.cast(await shell.tools.nslookup(domain.valueOf()));
	};
	api.whois = async function(ip) {
		return typer.cast(await shell.tools.whois(ip.valueOf()));
	};
	api.is_valid_ip = function(str) {
		return typer.cast(shell.tools.isValidIP(str.valueOf()));
	};
	api.is_lan_ip = function(str) {
		return typer.cast(shell.tools.isLanIP(str.valueOf()));
	};
	api.user_mail_address = function() {
		shell.echo('user_mail_address is not yet supported');
		return typer.cast(null);
	};
	api.user_bank_number = function() {
		shell.echo('user_bank_number is not yet supported');
		return typer.cast(null);
	};
	api.clear_screen = function() {
		shell.clear();
	};

	return api;
};