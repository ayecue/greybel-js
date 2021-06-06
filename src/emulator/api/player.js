const db = require('./db');

exports.get = async function() {
	const result = await db().get(`
		SELECT ComputerID, PlayerID 
		FROM Players;
	`);

	return {
		computerId: result.ComputerID,
		playerId: result.PlayerID
	};
};