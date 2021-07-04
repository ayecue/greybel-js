const dbClient = require('./db').client;

exports.get = function() {
	const rows = dbClient.queryAll('players', {
			limit: 1
		});
		const result = rows[0];

	return {
		computerId: result.ComputerID,
		playerId: result.PlayerID
	};
};