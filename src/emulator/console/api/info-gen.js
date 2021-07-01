const db = require('./db');
const parser = require('../parser/info-gen');

exports.get = async function() {
	const result = await db.client().get(`
		SELECT
			CurrentVersions,
			VersionsControl,
			Exploits,
			Clock
		FROM InfoGen
		LIMIT 1
	`);

	return {
		currentVersions: parser.parseCurrentVersions(result.CurrentVersions),
		versionsControl: parser.parseVersionsControl(result.VersionsControl),
		exploits: parser.parseExploits(result.Exploits),
		clock: parser.parseClock(result.Clock)
	};
};