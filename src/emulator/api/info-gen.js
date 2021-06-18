const db = require('./db');

exports.get = async function(id) {
	const result = await db.client().get(`
		SELECT
			VersionsControl,
			Exploits
		FROM InfoGen
		LIMIT 1
	`);

	return {
		versionsControl: db.parseBlob(result.VersionsControl),
		exploits: db.parseBlob(result.Exploits)
	};
};