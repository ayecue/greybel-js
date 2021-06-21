const db = require('./db');

exports.get = async function() {
	const result = await db.client().get(`
		SELECT
			VersionsControl,
			Exploits,
			Clock
		FROM InfoGen
		LIMIT 1
	`);

	return {
		versionsControl: db.parseBlob(result.VersionsControl),
		exploits: db.parseBlob(result.Exploits),
		clock: db.parseBlob(result.Clock)
	};
};