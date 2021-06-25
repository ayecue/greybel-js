const db = require('./db');

exports.get = async function(id) {
	let content = '';

	try {
		const result = await db.client().get(`
			SELECT Content
			FROM Files
			WHERE ID = $0
		`, [id]);
		content = result.Content;
	} catch (err) {
	}

	return content;
};