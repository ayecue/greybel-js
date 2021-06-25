const typer = require('../../../cps-evaluator/typer');
const computer = require('./computer');
const NewShell = require('../signals/new-shell');

module.exports = function(shell) {
	const api = {};

	api.get_shell = function(username, password) {
		const subShell = shell.fork(username?.valueOf(), password?.valueOf());

		const createInterface = function(contextShell) {
			if (contextShell == null) return null;

			const shellInterface = {};

			shellInterface.__isa = 'shell';
			shellInterface.host_computer = computer(contextShell);
			shellInterface.start_terminal = function() {
				contextShell.attach();
				return Promise.reject(new NewShell(contextShell));
			};
			shellInterface.connect_service = async function(ip, port, username, password) {
				const remoteShell = await contextShell.connect(ip, port, username, password);

				return typer.cast(createInterface(remoteShell));
			};
			shellInterface.scp = function() {
				shell.echo('Shell.scp not yet supported.');
				return typer.cast('Not yet supported');
			};
			shellInterface.launch = function() {
				shell.echo('Shell.launch not yet supported.');
				return typer.cast(0);
			};
			shellInterface.build = function() {
				shell.echo('Shell.build not yet supported.');
				return typer.cast('Not yet supported');
			};
			shellInterface.ping = function() {
				shell.echo('Shell.ping not yet supported.');
				return typer.cast('Not yet supported');
			};

			return shellInterface;
		};

		return typer.cast(createInterface(subShell));
	};

	return api;
};