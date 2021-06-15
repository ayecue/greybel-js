const players = require('./fixtures/Players.json');

exports.get = async function() {
	const result = players[0];

	return {
		computerId: result.ComputerID,
		playerId: result.PlayerID
	};
};