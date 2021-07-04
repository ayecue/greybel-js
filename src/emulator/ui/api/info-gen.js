const dbClient = require('./db').client;
const parser = require('../parser/info-gen');

exports.get = function(id) {
	const rows = dbClient.queryAll('infoGen', {
		limit: 1
	});
	const result = rows[0];

	return {
		currentVersions: parser.parseCurrentVersions(result.CurrentVersions),
		versionsControl: parser.parseVersionsControl(result.VersionsControl),
		exploits: parser.parseExploits(result.Exploits),
		clock: parser.parseClock(result.Clock)
	};
};