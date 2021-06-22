const typer = require('../../cps-evaluator/typer');

module.exports = function(shell) {
	const metaxploitInterface = {};

	metaxploitInterface.load = function(library) {
		shell.echo('load is not yet supported');
		return typer.cast(null);
	};

	metaxploitInterface.net_use = function(IP, port) {
		shell.echo('net_use is not yet supported');
		return typer.cast(null);
	};

	metaxploitInterface.rshell_client = function(IP, port, procName) {
		shell.echo('rshell_client is not yet supported');
	};

	metaxploitInterface.rshell_server = function() {
		shell.echo('rshell_server is not yet supported');
		return typer.cast([]);
	};

	metaxploitInterface.scan = function(metalib) {
		shell.echo('scan is not yet supported');
		return typer.cast(null);
	};

	metaxploitInterface.scan_address = function(metalib, memoryAddress) {
		shell.echo('scan_address is not yet supported');
		return typer.cast(null);
	};

	metaxploitInterface.sniffer = function(saveEncSource) {
		shell.echo('sniffer is not yet supported');
		return typer.cast(null);
	};

	return metaxploitInterface;
};