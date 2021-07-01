const typer = require('../../../cps-evaluator/typer');

module.exports = function(shell) {
	const cryptoInterface = {};

	cryptoInterface.aircrack = function(filepath) {
		shell.echo('aircrack is not yet supported');
		return typer.cast(null);
	};

	cryptoInterface.aireplay = function(bssid, essid, maxAcks) {
		shell.echo('aireplay is not yet supported');
		return typer.cast('not yet supported');
	};

	cryptoInterface.airmon = function(option, interf) {
		shell.echo('airmon is not yet supported');
	};

	cryptoInterface.decipher = function(user, encryptedPass) {
		shell.echo('decipher is not yet supported');
		return typer.cast(null);
	};

	cryptoInterface.smtp_user_list = function(IP, port) {
		shell.echo('smtp_user_list is not yet supported');
		return typer.cast('email not found');
	};

	return cryptoInterface;
};