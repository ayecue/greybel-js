const db = require('./db');

exports.get = async function(id) {
	const result = await db().get(`
		SELECT
			VersionsControl,
			Exploits
		FROM InfoGen
		LIMIT 1
	`);

	return {
		versionsControl: result.VersionsControl,
		exploits: result.Exploits
	};
};