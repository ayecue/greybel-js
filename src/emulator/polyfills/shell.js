const typer = require('../../cps-evaluator/typer');
const computer = require('./computer');

module.exports = function(vm) {
	const api = {};

	api.get_shell = function(username, password) {
		const session = vm.getLastSession();

		if (username != null && password != null) {
			const success = session.computer.login(username, password);

			if (!success) {
				return null;
			}
		}

		const shellInterface = {};

		shellInterface.__isa = 'shell';
		shellInterface.host_computer = computer(session);
		shellInterface.start_terminal = function() {
			console.log('Method start_terminal is not supported.');
		};

		return typer.cast(shellInterface);
	};

	return api;
};