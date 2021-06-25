const db = require('./db');

exports.getById = async function(id) {
	const result = await db.client().get(`
		SELECT WebAddress
		FROM Map
		WHERE ID = $0
	`, [id]);

	return {
		webAddress: result.WebAddress
	};
};