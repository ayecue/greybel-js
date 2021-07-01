const typer = require('../../../cps-evaluator/typer');
const file = require('./file');

module.exports = function(shell) {
	const computer = shell.computer;
	const computerInterface = {};

	computerInterface.__isa = 'computer';
	computerInterface.File = file.bind(null, shell);
	computerInterface.show_procs = function() {
		shell.echo('show_procs is not yet supported');
		return typer.cast('');
	};
	computerInterface.change_password = function(user, password) {
		shell.echo('change_password is not yet supported');
		return typer.cast('not yet supported');
	};
	computerInterface.create_user = function(user, password) {
		shell.echo('create_user is not yet supported');
		return typer.cast('not yet supported');
	};
	computerInterface.create_group = function(username, groupname) {
		shell.echo('create_group is not yet supported');
		return typer.cast('not yet supported');
	};
	computerInterface.create_folder = function(path, name) {
		shell.echo('create_folder is not yet supported');
		return typer.cast(null);
	};
	computerInterface.close_program = function(pid) {
		shell.echo('close_program is not yet supported');
		return typer.cast('not yet supported');
	};
	computerInterface.connect_wifi = function(interf, bssid, essid, password) {
		shell.echo('connect_wifi is not yet supported');
		return typer.cast('not yet supported');
	};
	computerInterface.delete_user = function(user, removeHome) {
		shell.echo('delete_user is not yet supported');
		return typer.cast('not yet supported');
	};
	computerInterface.delete_group = function(username, groupname) {
		shell.echo('delete_group is not yet supported');
		return typer.cast('not yet supported');
	};
	computerInterface.groups = function(username) {
		shell.echo('groups is not yet supported');
		return typer.cast('');
	};
	computerInterface.get_ports = function(username) {
		shell.echo('get_ports is not yet supported');
		return typer.cast([]);
	};
	computerInterface.is_network_active = function() {
		shell.echo('is_network_active is not yet supported');
		return typer.cast(0);
	};
	computerInterface.lan_ip = function() {
		shell.echo('lan_ip is not yet supported');
		return typer.cast('127.0.0.1');
	};
	computerInterface.touch = function(path, filename) {
		shell.echo('touch is not yet supported');
		return typer.cast('not yet supported');
	};
	computerInterface.wifi_networks = function(interf) {
		shell.echo('wifi_networks is not yet supported');
		return typer.cast([]);
	};
	computerInterface.network_devices = function(interf) {
		shell.echo('network_devices is not yet supported');
		return typer.cast('');
	};

	return typer.cast(computerInterface);
};